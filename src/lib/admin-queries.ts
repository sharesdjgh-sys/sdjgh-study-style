// Queries return only explicit administrative projections, never account secrets or responses.
// Each query uses a single PostgreSQL statement/snapshot, including live + rolled-up analytics.
export const ACCOUNT_CTES = `WITH open_skills AS (
 SELECT account_id,method FROM skill_unlocks
 UNION
 SELECT c.account_id,s.method FROM collection_cards c
 JOIN skill_catalog s ON s.character_code=c.type_code WHERE c.opened_at IS NOT NULL
), card_counts AS (
 SELECT account_id,count(*) FILTER(WHERE opened_at IS NOT NULL)::int AS opened,
 count(*) FILTER(WHERE opened_at IS NULL)::int AS pending FROM collection_cards GROUP BY account_id
), skill_counts AS (
 SELECT account_id,count(*)::int AS skills FROM open_skills GROUP BY account_id
), practice_counts AS (
 SELECT account_id,count(*)::int AS completed FROM skill_practices WHERE status='completed' GROUP BY account_id
), goods_counts AS (
 SELECT account_id,count(*)::int AS goods FROM goods_unlocks GROUP BY account_id
), account_stats AS (
 SELECT a.id,a.created_at AS "createdAt",a.registered_at AS "registeredAt",a.first_type AS "firstType",
 COALESCE(c.opened,0) AS opened,COALESCE(c.pending,0) AS pending,
 COALESCE(s.skills,0) AS skills,COALESCE(p.completed,0) AS completed,
 COALESCE(g.goods,0) AS goods,a.heart_balance AS hearts,a.star_balance AS stars
 FROM collection_accounts a
 LEFT JOIN card_counts c ON c.account_id=a.id
 LEFT JOIN skill_counts s ON s.account_id=a.id
 LEFT JOIN practice_counts p ON p.account_id=a.id
 LEFT JOIN goods_counts g ON g.account_id=a.id
)`;
export const ADMIN_STATS_SQL =
  ACCOUNT_CTES +
  `,
bounds AS (
 SELECT ($1::date::timestamp AT TIME ZONE 'Asia/Seoul') AS lo,
 (($2::date+1)::timestamp AT TIME ZONE 'Asia/Seoul') AS hi,
 CASE WHEN $2::date-$1::date>=90 THEN 'month' ELSE 'day' END AS bucket
), analytics AS (
 SELECT date_trunc((SELECT bucket FROM bounds),s.created_at AT TIME ZONE 'Asia/Seoul')::date::text AS day,s.source,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='start'))::int AS starts,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='complete'))::int AS completions
 FROM study_sessions s,bounds b WHERE s.created_at>=b.lo AND s.created_at<b.hi GROUP BY 1,2
 UNION ALL
 SELECT date_trunc((SELECT bucket FROM bounds),day::timestamp)::date::text,source,
 COALESCE(sum(total) FILTER(WHERE metric='start'),0)::int,
 COALESCE(sum(total) FILTER(WHERE metric='complete'),0)::int
 FROM study_daily WHERE day BETWEEN $1::date AND $2::date AND metric IN ('start','complete')
 GROUP BY 1,2
), participation AS (
 SELECT day,sum(starts)::int AS starts,sum(completions)::int AS completions
 FROM analytics GROUP BY day
), events AS (
 SELECT date_trunc((SELECT bucket FROM bounds),created_at AT TIME ZONE 'Asia/Seoul')::date::text AS day,'accounts' AS kind FROM collection_accounts,bounds WHERE created_at>=lo AND created_at<hi
 UNION ALL SELECT date_trunc((SELECT bucket FROM bounds),registered_at AT TIME ZONE 'Asia/Seoul')::date::text,'registrations' FROM collection_accounts,bounds WHERE registered_at>=lo AND registered_at<hi
 UNION ALL SELECT date_trunc((SELECT bucket FROM bounds),opened_at AT TIME ZONE 'Asia/Seoul')::date::text,'cards' FROM collection_cards,bounds WHERE opened_at>=lo AND opened_at<hi
 UNION ALL SELECT date_trunc((SELECT bucket FROM bounds),created_at AT TIME ZONE 'Asia/Seoul')::date::text,'goods' FROM goods_unlocks,bounds WHERE created_at>=lo AND created_at<hi
), activity AS (
 SELECT e.day,count(*) FILTER(WHERE e.kind='accounts')::int AS accounts,
 count(*) FILTER(WHERE e.kind='registrations')::int AS registrations,
 count(*) FILTER(WHERE e.kind='cards')::int AS cards,
 count(*) FILTER(WHERE e.kind='goods')::int AS goods
 FROM events e GROUP BY e.day
), characters AS (
 SELECT s.character_code AS code,
 (SELECT count(*)::int FROM collection_accounts a WHERE a.first_type=s.character_code) AS firsts,
 (SELECT count(*)::int FROM collection_cards c WHERE c.type_code=s.character_code AND c.opened_at IS NOT NULL) AS owners,
 (SELECT count(*)::int FROM collection_cards c WHERE c.type_code=s.character_code AND c.opened_at IS NULL) AS pending
 FROM skill_catalog s WHERE s.character_code IS NOT NULL
), distribution AS (
 SELECT n AS cards,count(a.id)::int AS accounts FROM generate_series(0,16) n
 LEFT JOIN account_stats a ON a.opened=n AND a."registeredAt" IS NOT NULL GROUP BY n
), skills AS (
 SELECT s.method,
 (SELECT count(*)::int FROM open_skills o WHERE o.method=s.method) AS owners,
 count(p.id)::int AS starts,count(p.id) FILTER(WHERE p.status='completed')::int AS completions,
 count(DISTINCT p.account_id) FILTER(WHERE p.status='completed')::int AS completers
 FROM skill_catalog s
 LEFT JOIN skill_practices p ON p.method=s.method AND p.created_at>=(SELECT lo FROM bounds) AND p.created_at<(SELECT hi FROM bounds)
 GROUP BY s.method
), goods AS (
 SELECT c.id,c.character_code AS code,c.kind,count(u.account_id)::int AS owners,
 count(u.account_id) FILTER(WHERE u.created_at>=(SELECT lo FROM bounds) AND u.created_at<(SELECT hi FROM bounds))::int AS exchanges
 FROM goods_catalog c LEFT JOIN goods_unlocks u ON u.goods_id=c.id GROUP BY c.id
)
SELECT jsonb_build_object(
 'generatedAt',now(),
 'summary',(SELECT jsonb_build_object(
   'accounts',count(*),'registered',count(*) FILTER(WHERE "registeredAt" IS NOT NULL),
   'cards',COALESCE(sum(opened),0),'pending',COALESCE(sum(pending),0),
   'complete',count(*) FILTER(WHERE opened=16 AND "registeredAt" IS NOT NULL),
   'average',COALESCE(round(avg(opened) FILTER(WHERE "registeredAt" IS NOT NULL),2),0),
   'practices',COALESCE(sum(completed),0),'goods',COALESCE(sum(goods),0)
 ) FROM account_stats),
 'participation',COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY day) FROM participation p),'[]'::jsonb),
 'sources',COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY source) FROM (
   SELECT source,sum(starts)::int AS starts,sum(completions)::int AS completions FROM analytics GROUP BY source
 ) s),'[]'::jsonb),
 'activity',COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY day) FROM activity a),'[]'::jsonb),
 'characters',COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY code) FROM characters c),'[]'::jsonb),
 'distribution',COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY cards) FROM distribution d),'[]'::jsonb),
 'skills',COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY completions DESC,method) FROM skills s),'[]'::jsonb),
 'goods',COALESCE((SELECT jsonb_agg(to_jsonb(g) ORDER BY exchanges DESC,id) FROM goods g),'[]'::jsonb)
) AS data`;
export const ADMIN_ACCOUNTS_SQL =
  ACCOUNT_CTES +
  `,
filtered AS (
 SELECT * FROM account_stats WHERE
 ($1='' OR position($1 in id::text)>0) AND ($2='' OR "firstType"=$2) AND
 ($3='all' OR ($3='unregistered' AND "registeredAt" IS NULL) OR
 ($3='collecting' AND "registeredAt" IS NOT NULL AND opened<16) OR ($3='complete' AND opened=16))
), page AS (
 SELECT * FROM filtered
 ORDER BY CASE WHEN $4='cards' THEN opened END DESC,"createdAt" DESC,id
 LIMIT $5 OFFSET $6
)
SELECT jsonb_build_object('generatedAt',now(),'total',(SELECT count(*) FROM filtered),
 'rows',COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY CASE WHEN $4='cards' THEN opened END DESC,"createdAt" DESC,id) FROM page p),'[]'::jsonb)
) AS data`;
export const ADMIN_DETAIL_SQL =
  ACCOUNT_CTES +
  `
SELECT jsonb_build_object('generatedAt',now(),'account',to_jsonb(a),
 'cards',COALESCE((SELECT jsonb_agg(jsonb_build_object('code',type_code,'openedAt',opened_at) ORDER BY type_code) FROM collection_cards WHERE account_id=a.id),'[]'::jsonb),
 'skills',COALESCE((SELECT jsonb_agg(method ORDER BY method) FROM open_skills WHERE account_id=a.id),'[]'::jsonb),
 'goods',COALESCE((SELECT jsonb_agg(goods_id ORDER BY goods_id) FROM goods_unlocks WHERE account_id=a.id),'[]'::jsonb)
) AS data FROM account_stats a WHERE id=$1::uuid`;
