-- One permanent inventory slot per funded prize. Deleted accounts never release issued slots.
CREATE TABLE IF NOT EXISTS sdj_prize_cards (
  number smallint PRIMARY KEY CHECK (number BETWEEN 1 AND 29),
  design text NOT NULL UNIQUE,
  kind text NOT NULL,
  vouchers smallint GENERATED ALWAYS AS
    (CASE kind WHEN 'daily' THEN 1 WHEN 'special' THEN 2 WHEN 'family' THEN 3 WHEN 'full' THEN 5 END) STORED,
  account_id uuid REFERENCES collection_accounts(id) ON DELETE SET NULL,
  issued_at timestamptz,
  paid_at timestamptz,
  CHECK ((number BETWEEN 1 AND 15 AND kind='daily' AND design ~ '--daily-[0-9]+$')
      OR (number BETWEEN 16 AND 24 AND kind='special' AND design ~ '--special-[0-9]+$')
      OR (number BETWEEN 25 AND 28 AND kind='family' AND design IN ('visual','auditory','tactile','motion'))
      OR (number=29 AND kind='full' AND design='group-photo')),
  CHECK (account_id IS NULL OR issued_at IS NOT NULL),
  CHECK (paid_at IS NULL OR issued_at IS NOT NULL)
);
-- statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM sdj_prize_cards) THEN
    WITH eligible(design,kind) AS (VALUES
('visual-solo-planned--special-01','special'),
('visual-solo-planned--special-05','special'),
('visual-solo-planned--daily-01','daily'),
('visual-solo-flexible--special-02','special'),
('visual-solo-flexible--special-04','special'),
('visual-solo-flexible--daily-01','daily'),
('visual-team-planned--special-01','special'),
('visual-team-planned--special-04','special'),
('visual-team-planned--daily-01','daily'),
('visual-team-flexible--special-03','special'),
('visual-team-flexible--special-04','special'),
('visual-team-flexible--daily-03','daily'),
('auditory-solo-planned--special-01','special'),
('auditory-solo-planned--special-05','special'),
('auditory-solo-planned--daily-02','daily'),
('auditory-solo-flexible--special-01','special'),
('auditory-solo-flexible--special-05','special'),
('auditory-solo-flexible--daily-01','daily'),
('auditory-team-planned--special-01','special'),
('auditory-team-planned--special-03','special'),
('auditory-team-planned--daily-03','daily'),
('auditory-team-flexible--special-01','special'),
('auditory-team-flexible--special-04','special'),
('auditory-team-flexible--daily-01','daily'),
('tactile-solo-planned--special-01','special'),
('tactile-solo-planned--special-02','special'),
('tactile-solo-planned--daily-01','daily'),
('tactile-solo-flexible--special-02','special'),
('tactile-solo-flexible--special-04','special'),
('tactile-solo-flexible--daily-03','daily'),
('tactile-team-planned--special-01','special'),
('tactile-team-planned--special-03','special'),
('tactile-team-planned--daily-01','daily'),
('tactile-team-flexible--special-03','special'),
('tactile-team-flexible--special-05','special'),
('tactile-team-flexible--daily-01','daily'),
('motion-solo-planned--special-01','special'),
('motion-solo-planned--special-04','special'),
('motion-solo-planned--daily-02','daily'),
('motion-solo-flexible--special-01','special'),
('motion-solo-flexible--special-03','special'),
('motion-solo-flexible--daily-02','daily'),
('motion-team-planned--special-02','special'),
('motion-team-planned--special-04','special'),
('motion-team-planned--daily-03','daily'),
('motion-team-flexible--special-02','special'),
('motion-team-flexible--special-04','special'),
('motion-team-flexible--daily-02','daily')
    ), shuffled AS (
      SELECT *, row_number() OVER(PARTITION BY kind ORDER BY random()) AS pos FROM eligible
    )
    INSERT INTO sdj_prize_cards(number,design,kind)
    SELECT (CASE kind WHEN 'daily' THEN 0 ELSE 15 END + pos)::smallint, design, kind
    FROM shuffled WHERE (kind='daily' AND pos<=15) OR (kind='special' AND pos<=9)
    UNION ALL SELECT * FROM (VALUES (25,'visual','family'),(26,'auditory','family'),(27,'tactile','family'),(28,'motion','family'),(29,'group-photo','full')) g;
  END IF;
  IF (SELECT count(*)<>29 OR sum(vouchers)<>50 FROM sdj_prize_cards) THEN RAISE EXCEPTION 'Incorrect SDJ voucher inventory'; END IF;
END $$;
-- statement-breakpoint
CREATE OR REPLACE VIEW sdj_prize_totals AS
SELECT kind,count(*) AS capacity,count(issued_at) AS issued,count(paid_at) AS paid,
  sum(vouchers) AS voucher_capacity, sum(vouchers)*2000 AS budget_won,
  coalesce(sum(vouchers) FILTER (WHERE issued_at IS NULL),0) AS unissued_vouchers,
  coalesce(sum(vouchers) FILTER (WHERE paid_at IS NOT NULL),0) AS paid_vouchers
FROM sdj_prize_cards GROUP BY kind;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION issue_sdj_prize_on_unlock() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE family text; owned_count integer; family_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sdj_qr_rewards WHERE account_id=NEW.account_id) THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='goods_unlocks' THEN
    UPDATE sdj_prize_cards SET account_id=NEW.account_id,issued_at=now()
      WHERE design=NEW.goods_id AND kind IN ('daily','special') AND issued_at IS NULL;
  ELSE
    family:=split_part(NEW.type_code,'-',1);
    SELECT count(*),count(*) FILTER(WHERE split_part(type_code,'-',1)=family) INTO owned_count,family_count
      FROM collection_cards WHERE account_id=NEW.account_id AND opened_at IS NOT NULL;
    UPDATE sdj_prize_cards SET account_id=NEW.account_id,issued_at=now()
      WHERE issued_at IS NULL AND ((kind='family' AND design=family AND family_count=4) OR (kind='full' AND owned_count=16));
  END IF;
  RETURN NEW;
END $$;
-- statement-breakpoint
CREATE OR REPLACE TRIGGER sdj_goods_prize AFTER INSERT ON goods_unlocks
FOR EACH ROW EXECUTE FUNCTION issue_sdj_prize_on_unlock();
-- statement-breakpoint
CREATE OR REPLACE TRIGGER sdj_group_prize AFTER INSERT OR UPDATE OF opened_at ON collection_cards
FOR EACH ROW WHEN (NEW.opened_at IS NOT NULL) EXECUTE FUNCTION issue_sdj_prize_on_unlock();