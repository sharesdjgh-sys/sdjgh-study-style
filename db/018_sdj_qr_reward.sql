-- The QR link qualifies an account. Opening its first character unlocks the gift.
CREATE TABLE IF NOT EXISTS sdj_qr_rewards (
  account_id uuid PRIMARY KEY REFERENCES collection_accounts(id) ON DELETE CASCADE,
  granted_type text
);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION claim_sdj_qr_reward(p_account uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE first_card text; granted text;
BEGIN
  SELECT first_type INTO STRICT first_card FROM collection_accounts WHERE id=p_account FOR UPDATE;
  INSERT INTO sdj_qr_rewards(account_id) VALUES(p_account) ON CONFLICT DO NOTHING;
  IF first_card IS NULL THEN RETURN 'awaiting_result'; END IF;
  SELECT granted_type INTO granted FROM sdj_qr_rewards WHERE account_id=p_account;
  IF granted IS NOT NULL THEN RETURN 'already_granted'; END IF;
  granted := grant_random_card(p_account,false);
  IF granted IS NULL THEN RETURN 'collection_complete'; END IF;
  UPDATE sdj_qr_rewards SET granted_type=granted WHERE account_id=p_account;
  RETURN 'granted';
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION finish_sdj_qr_reward() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM sdj_qr_rewards WHERE account_id=NEW.account_id) THEN
    PERFORM claim_sdj_qr_reward(NEW.account_id);
  END IF;
  RETURN NEW;
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE TRIGGER sdj_qr_first_card AFTER INSERT ON collection_cards
FOR EACH ROW WHEN (NEW.source='first') EXECUTE FUNCTION finish_sdj_qr_reward();
