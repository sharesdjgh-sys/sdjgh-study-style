ALTER TABLE collection_accounts ADD COLUMN IF NOT EXISTS referral_eligible boolean NOT NULL DEFAULT true;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS collection_withdrawals (
  identity_hash text PRIMARY KEY CHECK (identity_hash ~ '^[a-f0-9]{64}$'),
  withdrawn_at timestamptz NOT NULL,
  rejoin_after timestamptz NOT NULL,
  CHECK (rejoin_after = withdrawn_at + interval '168 hours')
);
-- statement-breakpoint
-- All account creation/deletion paths lock the same pseudonymous identity first.
-- A single function call is atomic, including account creation and session issue.
CREATE OR REPLACE FUNCTION establish_collection_session(
  p_kakao_id text, p_identity_hash text, p_invite_code text,
  p_token_hash text, p_previous_hash text
) RETURNS TABLE(account_id uuid, rejoin_after timestamptz) LANGUAGE plpgsql AS $$
DECLARE
  existing_id uuid;
  blocked_until timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_identity_hash, 0));
  SELECT w.rejoin_after INTO blocked_until FROM collection_withdrawals w
    WHERE w.identity_hash=p_identity_hash;
  IF blocked_until > clock_timestamp() THEN
    RETURN QUERY SELECT NULL::uuid, blocked_until;
    RETURN;
  END IF;
  INSERT INTO collection_accounts(kakao_id,invite_code,referral_eligible)
    VALUES(p_kakao_id,p_invite_code,blocked_until IS NULL)
    ON CONFLICT(kakao_id) DO UPDATE SET kakao_id=EXCLUDED.kakao_id
    RETURNING id INTO existing_id;
  DELETE FROM collection_sessions WHERE token_hash=p_previous_hash;
  INSERT INTO collection_sessions(token_hash,account_id,expires_at)
    VALUES(p_token_hash,existing_id,clock_timestamp()+interval '30 days');
  RETURN QUERY SELECT existing_id, NULL::timestamptz;
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION withdraw_collection_account(p_account uuid, p_identity_hash text)
RETURNS timestamptz LANGUAGE plpgsql AS $$
DECLARE
  removed_at timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_identity_hash, 0));
  PERFORM 1 FROM collection_accounts WHERE id=p_account FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  removed_at := clock_timestamp();
  INSERT INTO collection_withdrawals(identity_hash,withdrawn_at,rejoin_after)
    VALUES(p_identity_hash,removed_at,removed_at+interval '168 hours')
    ON CONFLICT(identity_hash) DO UPDATE SET
      withdrawn_at=EXCLUDED.withdrawn_at,rejoin_after=EXCLUDED.rejoin_after;
  DELETE FROM collection_accounts WHERE id=p_account;
  RETURN removed_at+interval '168 hours';
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION register_collection(
  p_account uuid, p_run uuid, p_type text, p_invite text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  owner collection_accounts%ROWTYPE;
  inviter uuid;
BEGIN
  IF p_type !~ '^(visual|auditory|tactile|motion)-(solo|team)-(planned|flexible)$' THEN
    RAISE EXCEPTION 'invalid_type';
  END IF;
  SELECT * INTO owner FROM collection_accounts WHERE id=p_account FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown_account'; END IF;
  IF owner.first_type IS NOT NULL THEN RETURN 'already_registered'; END IF;
  IF EXISTS(SELECT 1 FROM collection_accounts WHERE first_run_id=p_run) THEN
    RETURN 'run_claimed';
  END IF;
  -- Returning accounts can register their own card and invite new friends, but
  -- cannot award either side another newcomer bonus, even via a direct API call.
  IF p_invite IS NOT NULL AND owner.referral_eligible THEN
    SELECT id INTO inviter FROM collection_accounts
      WHERE invite_code=p_invite AND first_type IS NOT NULL;
    IF inviter IS NULL THEN RETURN 'invalid_invite'; END IF;
    IF inviter=p_account THEN RETURN 'self_invite'; END IF;
    PERFORM 1 FROM collection_accounts WHERE id=inviter FOR UPDATE;
  END IF;
  UPDATE collection_accounts SET first_type=p_type,first_run_id=p_run,
    registered_at=now() WHERE id=p_account;
  INSERT INTO collection_cards(account_id,type_code,source,opened_at)
    VALUES(p_account,p_type,'first',now());
  IF inviter IS NOT NULL THEN
    INSERT INTO collection_referrals(invitee_id,inviter_id) VALUES(p_account,inviter);
    PERFORM grant_random_card(p_account,true);
    PERFORM grant_random_card(inviter,false);
  END IF;
  RETURN CASE WHEN inviter IS NULL THEN 'registered' ELSE 'referred' END;
END;
$$;
