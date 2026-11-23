INSERT INTO goods_catalog(id, character_code, kind, cost)
SELECT character_code || '--wearable-02', character_code, 'special', 2
FROM goods_catalog
WHERE id = character_code || '--wearable-01'
ON CONFLICT(id) DO NOTHING;
