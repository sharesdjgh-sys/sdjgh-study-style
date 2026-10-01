CREATE TABLE IF NOT EXISTS collection_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id text NOT NULL UNIQUE,
  invite_code text NOT NULL UNIQUE,
  first_type text,
  first_run_id uuid UNIQUE,
  registered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((first_type IS NULL AND first_run_id IS NULL AND registered_at IS NULL)
    OR (first_type IS NOT NULL AND first_run_id IS NOT NULL AND registered_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS collection_sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS collection_session_expiry ON collection_sessions(expires_at);
CREATE TABLE IF NOT EXISTS collection_oauth_states (
  state_hash text PRIMARY KEY,
  browser_hash text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS collection_invites (
  token_hash text PRIMARY KEY,
  inviter_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS collection_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitee_id uuid UNIQUE REFERENCES collection_accounts(id) ON DELETE SET NULL,
  inviter_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (inviter_id <> invitee_id)
);
CREATE TABLE IF NOT EXISTS collection_cards (
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  type_code text NOT NULL CHECK (type_code ~ '^(visual|auditory|tactile|motion)-(solo|team)-(planned|flexible)$'),
  source text NOT NULL CHECK (source IN ('first','referral')),
  reward_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id,type_code)
);
CREATE TABLE IF NOT EXISTS collection_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);

-- A single SQL statement invokes this transaction. Locking the inviter serializes
-- simultaneous referrals; the browser never chooses a card or awards a reward.
CREATE OR REPLACE FUNCTION register_collection(
  p_account uuid, p_run uuid, p_type text, p_invite text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  owner collection_accounts%ROWTYPE;
  inviter uuid;
  picked text;
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
  IF p_invite IS NOT NULL THEN
    SELECT id INTO inviter FROM collection_accounts
      WHERE invite_code=p_invite AND first_type IS NOT NULL;
    IF inviter IS NULL THEN RETURN 'invalid_invite'; END IF;
    IF inviter=p_account THEN RETURN 'self_invite'; END IF;
    -- Only registered accounts can invite. They never await a first-registration
    -- lock themselves, avoiding cyclic locks between two unregistered accounts.
    PERFORM 1 FROM collection_accounts WHERE id=inviter FOR UPDATE;
  END IF;
  UPDATE collection_accounts SET first_type=p_type,first_run_id=p_run,
    registered_at=now() WHERE id=p_account;
  INSERT INTO collection_cards(account_id,type_code,source,opened_at)
    VALUES(p_account,p_type,'first',now());
  IF inviter IS NOT NULL THEN
    INSERT INTO collection_referrals(invitee_id,inviter_id) VALUES(p_account,inviter);
    SELECT m || '-' || s || '-' || p INTO picked
      FROM unnest(ARRAY['visual','auditory','tactile','motion']) m
      CROSS JOIN unnest(ARRAY['solo','team']) s
      CROSS JOIN unnest(ARRAY['planned','flexible']) p
      WHERE NOT EXISTS(SELECT 1 FROM collection_cards c
        WHERE c.account_id=inviter AND c.type_code=m || '-' || s || '-' || p)
      ORDER BY random() LIMIT 1;
    IF picked IS NOT NULL THEN
      INSERT INTO collection_cards(account_id,type_code,source)
        VALUES(inviter,picked,'referral');
    END IF;
  END IF;
  RETURN CASE WHEN inviter IS NULL THEN 'registered' ELSE 'referred' END;
END;
$$;
