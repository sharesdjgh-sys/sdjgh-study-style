-- Existing accounts are intentionally excluded from first-login onboarding.
ALTER TABLE collection_accounts ADD COLUMN IF NOT EXISTS install_prompt_token_hash text;
-- statement-breakpoint
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
  INSERT INTO collection_accounts(kakao_id,invite_code,referral_eligible,install_prompt_token_hash)
    VALUES(p_kakao_id,p_invite_code,blocked_until IS NULL,
      CASE WHEN blocked_until IS NULL THEN p_token_hash ELSE NULL END)
    ON CONFLICT(kakao_id) DO UPDATE SET kakao_id=EXCLUDED.kakao_id,
      install_prompt_token_hash=NULL
    RETURNING id INTO existing_id;
  DELETE FROM collection_sessions WHERE token_hash=p_previous_hash;
  INSERT INTO collection_sessions(token_hash,account_id,expires_at)
    VALUES(p_token_hash,existing_id,clock_timestamp()+interval '30 days');
  RETURN QUERY SELECT existing_id, NULL::timestamptz;
END;
$$;
