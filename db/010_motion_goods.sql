ALTER TABLE goods_catalog DROP CONSTRAINT IF EXISTS goods_catalog_kind_check;
-- statement-breakpoint
ALTER TABLE goods_catalog ADD CONSTRAINT goods_catalog_kind_check CHECK(kind IN ('daily','special','motion'));
-- statement-breakpoint
INSERT INTO goods_catalog(id,character_code,kind,cost)
SELECT DISTINCT character_code||'--motion-01',character_code,'motion',3
FROM skill_catalog WHERE character_code IS NOT NULL
ON CONFLICT(id) DO UPDATE SET character_code=EXCLUDED.character_code,kind=EXCLUDED.kind,cost=EXCLUDED.cost;
