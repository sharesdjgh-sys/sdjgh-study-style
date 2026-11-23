INSERT INTO goods_catalog(id,character_code,kind,cost)
SELECT DISTINCT character_code||'--wearable-01',character_code,'special',2
FROM skill_catalog WHERE character_code IS NOT NULL ON CONFLICT(id) DO NOTHING;
-- statement-breakpoint
ALTER TABLE goods_unlocks ADD COLUMN IF NOT EXISTS equipped boolean NOT NULL DEFAULT false;
