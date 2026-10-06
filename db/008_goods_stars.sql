ALTER TABLE collection_accounts ADD COLUMN IF NOT EXISTS star_balance integer NOT NULL DEFAULT 0 CHECK(star_balance>=0);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS star_ledger (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(reason IN ('practice','family','goods')), reference text NOT NULL,
 amount integer NOT NULL CHECK(amount<>0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(account_id,reason,reference)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS goods_catalog (
 id text PRIMARY KEY, character_code text NOT NULL, kind text NOT NULL CHECK(kind IN ('daily','special')), cost integer NOT NULL CHECK(cost>0)
);
-- statement-breakpoint
INSERT INTO goods_catalog(id,character_code,kind,cost)
SELECT character_code||'--'||theme,character_code,kind,t.cost FROM skill_catalog
CROSS JOIN (VALUES ('daily-01','daily',1),('daily-02','daily',1),('daily-03','daily',1),
 ('special-01','special',2),('special-02','special',2),('special-03','special',2),('special-04','special',2),('special-05','special',2)) t(theme,kind,cost)
WHERE character_code IS NOT NULL ON CONFLICT(id) DO UPDATE SET cost=EXCLUDED.cost;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS goods_unlocks (
 account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE, goods_id text NOT NULL REFERENCES goods_catalog(id),
 paid integer NOT NULL CHECK(paid>0), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(account_id,goods_id)
);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION credit_stars(p_account uuid,p_reason text,p_reference text,p_amount integer)
RETURNS integer LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM collection_accounts WHERE id=p_account FOR UPDATE;
 IF NOT FOUND THEN RETURN 0; END IF;
 INSERT INTO star_ledger(account_id,reason,reference,amount) VALUES(p_account,p_reason,p_reference,p_amount)
 ON CONFLICT(account_id,reason,reference) DO NOTHING;
 IF NOT FOUND THEN RETURN 0; END IF;
 UPDATE collection_accounts SET star_balance=star_balance+p_amount WHERE id=p_account;
 RETURN p_amount;
END; $$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION award_family_stars(p_account uuid) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE family text; awarded integer:=0;
BEGIN
 PERFORM 1 FROM collection_accounts WHERE id=p_account FOR UPDATE;
 IF NOT FOUND THEN RETURN 0; END IF;
 FOR family IN SELECT split_part(c.type_code,'-',1) FROM collection_cards c JOIN skill_catalog s ON s.character_code=c.type_code
 WHERE c.account_id=p_account AND c.opened_at IS NOT NULL GROUP BY split_part(c.type_code,'-',1) HAVING count(DISTINCT c.type_code)=4
 LOOP awarded:=awarded+credit_stars(p_account,'family',family,3); END LOOP;
 RETURN awarded;
END; $$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION card_family_star_reward() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.opened_at IS NOT NULL THEN PERFORM award_family_stars(NEW.account_id); END IF;
 RETURN NEW;
END; $$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS card_family_star_reward_trigger ON collection_cards;
-- statement-breakpoint
CREATE TRIGGER card_family_star_reward_trigger AFTER INSERT OR UPDATE OF opened_at ON collection_cards FOR EACH ROW EXECUTE FUNCTION card_family_star_reward();
-- statement-breakpoint
CREATE OR REPLACE FUNCTION redeem_goods(p_account uuid,p_goods text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE balance integer; item goods_catalog%ROWTYPE;
BEGIN
 SELECT star_balance INTO balance FROM collection_accounts WHERE id=p_account FOR UPDATE;
 IF NOT FOUND THEN RETURN 'unauthorized'; END IF;
 SELECT * INTO item FROM goods_catalog WHERE id=p_goods;
 IF NOT FOUND THEN RETURN 'not_found'; END IF;
 IF EXISTS(SELECT 1 FROM goods_unlocks WHERE account_id=p_account AND goods_id=p_goods) THEN RETURN 'already_owned'; END IF;
 IF NOT EXISTS(SELECT 1 FROM collection_cards WHERE account_id=p_account AND type_code=item.character_code AND opened_at IS NOT NULL) THEN RETURN 'character_required'; END IF;
 IF balance<item.cost THEN RETURN 'insufficient_stars'; END IF;
 INSERT INTO goods_unlocks(account_id,goods_id,paid) VALUES(p_account,p_goods,item.cost);
 PERFORM credit_stars(p_account,'goods',p_goods,-item.cost);
 RETURN 'redeemed';
END; $$;
-- statement-breakpoint
-- Previously earned hearts remain intact. Star rewards are once per skill, including old completions.
SELECT credit_stars(account_id,'practice',method,1) FROM (
 SELECT account_id,method FROM skill_practices WHERE status='completed'
 UNION SELECT account_id,reference AS method FROM heart_ledger WHERE reason='practice'
) prior;
-- statement-breakpoint
SELECT award_family_stars(id) FROM collection_accounts;

-- statement-breakpoint
CREATE OR REPLACE FUNCTION practice_action(p_account uuid,p_action text,p_method text DEFAULT NULL,p_id uuid DEFAULT NULL,p_answers jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r skill_practices%ROWTYPE; t timestamptz:=clock_timestamp(); awarded integer:=0;
BEGIN
  PERFORM 1 FROM collection_accounts WHERE id=p_account FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','unauthorized'); END IF;
  IF p_action='start' THEN
    IF NOT skill_is_open(p_account,p_method) THEN RETURN jsonb_build_object('error','locked'); END IF;
    SELECT * INTO r FROM skill_practices WHERE account_id=p_account AND status IN ('running','paused');
    IF FOUND THEN
      IF r.method<>p_method THEN RETURN jsonb_build_object('error','active_practice'); END IF;
    ELSE
      INSERT INTO skill_practices(account_id,method) VALUES(p_account,p_method) RETURNING * INTO r;
    END IF;
  ELSE
    SELECT * INTO r FROM skill_practices WHERE account_id=p_account AND id=p_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
    IF r.status='cancelled' THEN RETURN jsonb_build_object('error','cancelled'); END IF;
    IF r.status='completed' THEN RETURN jsonb_build_object('ok',true,'awarded',0); END IF;
    IF r.status='running' THEN r.elapsed:=LEAST(600,r.elapsed+GREATEST(0,extract(epoch FROM t-r.updated_at))); END IF;
    IF p_action='pause' THEN r.status:='paused';
    ELSIF p_action='resume' THEN r.status:='running';
    ELSIF p_action='cancel' THEN r.status:='cancelled';
    ELSIF p_action='complete' THEN
      IF r.elapsed<600 THEN RETURN jsonb_build_object('error','too_early'); END IF;
      IF p_answers IS NULL OR jsonb_typeof(p_answers)<>'array' THEN RETURN jsonb_build_object('error','answers'); END IF;
      IF jsonb_array_length(p_answers)<>3 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_answers) a WHERE a NOT IN ('0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb)) THEN RETURN jsonb_build_object('error','answers'); END IF;
      r.status:='completed';
      awarded:=credit_stars(p_account,'practice',r.method,1);
    ELSE RETURN jsonb_build_object('error','action'); END IF;
    UPDATE skill_practices SET status=r.status,elapsed=r.elapsed,updated_at=t,answers=CASE WHEN p_action='complete' THEN p_answers ELSE answers END WHERE id=r.id;
  END IF;
  RETURN jsonb_build_object('ok',true,'awarded',awarded);
END;
$$;
