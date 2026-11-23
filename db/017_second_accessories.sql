INSERT INTO goods_catalog(id, character_code, kind, cost)
SELECT character_code || '--wearable-03', character_code, 'special', 2
FROM goods_catalog WHERE id = character_code || '--wearable-01'
ON CONFLICT(id) DO NOTHING;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION set_wearable_equipped(
  owner_id uuid, item_id text, other_accessory text, wear boolean
) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM collection_accounts WHERE id=owner_id FOR UPDATE;
  UPDATE goods_unlocks SET equipped=wear WHERE account_id=owner_id AND goods_id=item_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF wear AND other_accessory IS NOT NULL THEN
    UPDATE goods_unlocks SET equipped=false WHERE account_id=owner_id AND goods_id=other_accessory AND equipped;
  END IF;
  RETURN true;
END;
$$;
