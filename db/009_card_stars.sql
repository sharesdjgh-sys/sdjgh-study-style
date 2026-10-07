-- Existing opened cards are excluded; pending and future cards receive a reward.
ALTER TABLE collection_cards ADD COLUMN IF NOT EXISTS star_reward integer CHECK(star_reward BETWEEN 0 AND 2);
-- statement-breakpoint
UPDATE collection_cards SET star_reward=0 WHERE opened_at IS NULL AND star_reward IS NULL;
-- statement-breakpoint
ALTER TABLE collection_cards ALTER COLUMN star_reward SET DEFAULT 0;
-- statement-breakpoint
ALTER TABLE star_ledger DROP CONSTRAINT IF EXISTS star_ledger_reason_check;
-- statement-breakpoint
ALTER TABLE star_ledger ADD CONSTRAINT star_ledger_reason_check CHECK(reason IN ('practice','family','goods','card'));
-- statement-breakpoint
CREATE OR REPLACE FUNCTION card_star_reward() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.opened_at IS NOT NULL AND NEW.star_reward=0 THEN
  PERFORM 1 FROM collection_accounts WHERE id=NEW.account_id FOR UPDATE;
  NEW.star_reward:=floor(random()*2)::integer+1;
  PERFORM credit_stars(NEW.account_id,'card',NEW.type_code,NEW.star_reward);
 END IF;
 RETURN NEW;
END; $$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS card_star_reward_trigger ON collection_cards;
-- statement-breakpoint
CREATE TRIGGER card_star_reward_trigger BEFORE INSERT OR UPDATE OF opened_at ON collection_cards
FOR EACH ROW EXECUTE FUNCTION card_star_reward();
