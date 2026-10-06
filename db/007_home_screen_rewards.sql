ALTER TABLE heart_ledger DROP CONSTRAINT IF EXISTS heart_ledger_reason_check;
-- statement-breakpoint
ALTER TABLE heart_ledger ADD CONSTRAINT heart_ledger_reason_check CHECK(reason IN ('card','unlock','refund','install','shortcut','practice'));
-- statement-breakpoint
-- Keep older installation API calls safe too: both home-screen rewards total 3.
CREATE OR REPLACE FUNCTION credit_hearts(p_account uuid,p_reason text,p_reference text,p_amount integer)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE received integer;
BEGIN
  PERFORM 1 FROM collection_accounts WHERE id=p_account FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF p_reason IN ('install','shortcut') THEN
    IF EXISTS(SELECT 1 FROM heart_ledger WHERE account_id=p_account AND reason=p_reason) THEN RETURN 0; END IF;
    SELECT COALESCE(sum(amount),0) INTO received FROM heart_ledger
      WHERE account_id=p_account AND reason IN ('install','shortcut') AND amount>0;
    p_amount:=CASE WHEN p_reason='install' THEN GREATEST(0,3-received)
      WHEN received=0 THEN 1 ELSE 0 END;
    p_reference:=CASE WHEN p_reason='install' THEN 'mobile-pwa' ELSE 'home-shortcut' END;
    IF p_amount=0 THEN RETURN 0; END IF;
  END IF;
  INSERT INTO heart_ledger(account_id,reason,reference,amount) VALUES(p_account,p_reason,p_reference,p_amount)
    ON CONFLICT(account_id,reason,reference) DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  UPDATE collection_accounts SET heart_balance=heart_balance+p_amount WHERE id=p_account;
  RETURN p_amount;
END;
$$;
