ALTER TABLE collection_oauth_states ADD COLUMN IF NOT EXISTS return_path text;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS skill_catalog (
  method text PRIMARY KEY, cost integer NOT NULL CHECK(cost BETWEEN 1 AND 3),
  character_code text UNIQUE
);
-- statement-breakpoint
INSERT INTO skill_catalog(method,cost,character_code) VALUES
('blank-page',1,NULL),('cornell',2,NULL),('flowchart',2,NULL),('feynman',2,NULL),
('self-quiz',1,NULL),('self-explanation',1,NULL),('card-sort',1,NULL),('leitner',2,NULL),
('interleaving',2,NULL),('gesture',1,NULL),('memory-palace',2,NULL),('spaced-retry',1,NULL),
('outline',3,'visual-solo-planned'),('dual-coding',3,'visual-solo-flexible'),
('timeline',3,'visual-team-planned'),('compare',3,'visual-team-flexible'),
('sq3r',3,'auditory-solo-planned'),('elaborative',3,'auditory-solo-flexible'),
('teach-back',3,'auditory-team-planned'),('socratic',3,'auditory-team-flexible'),
('error-note',3,'tactile-solo-planned'),('variation',3,'tactile-solo-flexible'),
('jigsaw',3,'tactile-team-planned'),('problem-posing',3,'tactile-team-flexible'),
('distributed',3,'motion-solo-planned'),('mini-quiz',3,'motion-solo-flexible'),
('peer-instruction',3,'motion-team-planned'),('gallery-walk',3,'motion-team-flexible')
ON CONFLICT(method) DO UPDATE SET cost=EXCLUDED.cost,character_code=EXCLUDED.character_code;
-- statement-breakpoint
ALTER TABLE collection_accounts ADD COLUMN IF NOT EXISTS heart_balance integer NOT NULL DEFAULT 0 CHECK(heart_balance>=0);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS heart_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK(reason IN ('card','unlock','refund','install','practice')),
  reference text NOT NULL, amount integer NOT NULL CHECK(amount<>0),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(account_id,reason,reference)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS skill_unlocks (
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  method text NOT NULL REFERENCES skill_catalog(method), paid integer NOT NULL,
  refunded boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,method)
);
-- statement-breakpoint
-- NULL means an old opened card excluded from backfill. New unopened cards get 0.
ALTER TABLE collection_cards ADD COLUMN IF NOT EXISTS heart_reward integer CHECK(heart_reward BETWEEN 0 AND 3);
-- statement-breakpoint
UPDATE collection_cards SET heart_reward=0 WHERE opened_at IS NULL AND heart_reward IS NULL;
-- statement-breakpoint
ALTER TABLE collection_cards ALTER COLUMN heart_reward SET DEFAULT 0;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION credit_hearts(p_account uuid,p_reason text,p_reference text,p_amount integer)
RETURNS integer LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM collection_accounts WHERE id=p_account FOR UPDATE;
  INSERT INTO heart_ledger(account_id,reason,reference,amount) VALUES(p_account,p_reason,p_reference,p_amount)
    ON CONFLICT(account_id,reason,reference) DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  UPDATE collection_accounts SET heart_balance=heart_balance+p_amount WHERE id=p_account;
  RETURN p_amount;
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION card_heart_reward() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m text; paid_amount integer;
BEGIN
  IF NEW.opened_at IS NOT NULL AND NEW.heart_reward=0 THEN
    PERFORM 1 FROM collection_accounts WHERE id=NEW.account_id FOR UPDATE;
    NEW.heart_reward:=floor(random()*3)::integer+1;
    PERFORM credit_hearts(NEW.account_id,'card',NEW.type_code,NEW.heart_reward);
    SELECT method INTO m FROM skill_catalog WHERE character_code=NEW.type_code;
    UPDATE skill_unlocks SET refunded=true WHERE account_id=NEW.account_id AND method=m AND NOT refunded
      RETURNING paid INTO paid_amount;
    IF paid_amount IS NOT NULL THEN PERFORM credit_hearts(NEW.account_id,'refund',m,paid_amount); END IF;
  END IF;
  RETURN NEW;
END;
$$;
-- statement-breakpoint
DROP TRIGGER IF EXISTS card_heart_reward_trigger ON collection_cards;
-- statement-breakpoint
CREATE TRIGGER card_heart_reward_trigger BEFORE INSERT OR UPDATE OF opened_at ON collection_cards
FOR EACH ROW EXECUTE FUNCTION card_heart_reward();
-- statement-breakpoint
CREATE OR REPLACE FUNCTION skill_is_open(p_account uuid,p_method text) RETURNS boolean LANGUAGE sql STABLE AS $$
SELECT EXISTS(SELECT 1 FROM skill_unlocks WHERE account_id=p_account AND method=p_method)
OR EXISTS(SELECT 1 FROM collection_cards c JOIN skill_catalog s ON s.character_code=c.type_code
 WHERE c.account_id=p_account AND s.method=p_method AND c.opened_at IS NOT NULL);
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION unlock_skill(p_account uuid,p_method text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE balance integer; price integer;
BEGIN
  SELECT heart_balance INTO balance FROM collection_accounts WHERE id=p_account FOR UPDATE;
  IF NOT FOUND THEN RETURN 'unauthorized'; END IF;
  SELECT cost INTO price FROM skill_catalog WHERE method=p_method;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF skill_is_open(p_account,p_method) THEN RETURN 'already_open'; END IF;
  IF balance<price THEN RETURN 'insufficient_hearts'; END IF;
  INSERT INTO skill_unlocks(account_id,method,paid) VALUES(p_account,p_method,price);
  PERFORM credit_hearts(p_account,'unlock',p_method,-price);
  RETURN 'unlocked';
END;
$$;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS skill_practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  method text NOT NULL REFERENCES skill_catalog(method),
  status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','paused','completed','cancelled')),
  elapsed double precision NOT NULL DEFAULT 0 CHECK(elapsed>=0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  answers jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS one_active_practice ON skill_practices(account_id) WHERE status IN ('running','paused');
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
      awarded:=credit_hearts(p_account,'practice',r.method,1);
    ELSE RETURN jsonb_build_object('error','action'); END IF;
    UPDATE skill_practices SET status=r.status,elapsed=r.elapsed,updated_at=t,answers=CASE WHEN p_action='complete' THEN p_answers ELSE answers END WHERE id=r.id;
  END IF;
  RETURN jsonb_build_object('ok',true,'awarded',awarded);
END;
$$;
