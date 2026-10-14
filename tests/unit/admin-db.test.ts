import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  ADMIN_STATS_SQL,
  ADMIN_ACCOUNTS_SQL,
  ADMIN_DETAIL_SQL,
} from "../../src/lib/admin-queries";
import { defaultAdminRange } from "../../src/lib/admin-contract";
let db: PGlite;
type Raw = {
  summary: Record<string, number>;
  participation: { starts: number; completions: number; day: string }[];
  characters: {
    code: string;
    firsts: number;
    owners: number;
    pending: number;
  }[];
  skills: {
    method: string;
    owners: number;
    starts: number;
    completions: number;
    completers: number;
  }[];
  goods: { kind: string; owners: number; exchanges: number }[];
  activity: { cards: number; goods: number }[];
};
beforeAll(async () => {
  db = new PGlite();
  for (const file of [
    "001_analytics.sql",
    "002_retention.sql",
    "003_collections.sql",
    "004_saved_results.sql",
    "005_account_lifecycle.sql",
    "006_skill_hearts.sql",
    "007_home_screen_rewards.sql",
    "008_goods_stars.sql",
    "009_card_stars.sql",
    "010_motion_goods.sql",
    "011_admin_indexes.sql",
    "012_analytics_history.sql",
  ])
    await db.exec(await readFile("db/" + file, "utf8"));
}, 60000);
beforeEach(async () => {
  await db.exec(
    "TRUNCATE collection_accounts,study_sessions,study_daily CASCADE",
  );
});
afterAll(async () => {
  await db.close();
});
async function account(type?: string) {
  const id = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
    [id, id, id],
  );
  if (type)
    await db.query("SELECT register_collection($1,$2,$3)", [
      id,
      randomUUID(),
      type,
    ]);
  return id;
}
async function snapshot(
  from = defaultAdminRange().from,
  to = defaultAdminRange().to,
) {
  return (await db.query<{ data: Raw }>(ADMIN_STATS_SQL, [from, to])).rows[0]
    .data;
}
it("빈 DB에서도 16종·28스킬·144굿즈와 0 집계를 반환한다", async () => {
  const data = await snapshot();
  expect(data.summary.accounts).toBe(0);
  expect(data.summary.average).toBe(0);
  expect(data.characters).toHaveLength(16);
  expect(data.skills).toHaveLength(28);
  expect(data.goods).toHaveLength(144);
  expect(data.participation).toHaveLength(0);
});
it("통계 정리 전후 원본과 집계 합산 결과가 동일하다", async () => {
  for (const old of [true, false]) {
    const id = randomUUID();
    await db.query(
      "INSERT INTO study_sessions(run_id,version,source,created_at,expires_at) VALUES($1,'v1','qr',now()-$2::interval,now()+$3::interval)",
      [id, old ? "8 days" : "1 day", old ? "-1 day" : "6 days"],
    );
    await db.query(
      "INSERT INTO study_events(run_id,name) VALUES($1,'start'),($1,'complete')",
      [id],
    );
  }
  const before = await snapshot();
  await db.exec("SELECT study_rollup()");
  const after = await snapshot();
  expect(after.participation).toEqual(before.participation);
  expect(after.participation.reduce((n, d) => n + d.starts, 0)).toBe(2);
  expect(after.participation.reduce((n, d) => n + d.completions, 0)).toBe(2);
  await db.exec("SELECT study_rollup()");
  expect((await snapshot()).participation).toEqual(after.participation);
});
it("한국 시간 시작일의 양끝 경계를 정확하게 적용한다", async () => {
  const today = defaultAdminRange(1).to;
  for (const delta of [-1, 0, 86399, 86400]) {
    const id = randomUUID();
    await db.query(
      "INSERT INTO study_sessions(run_id,version,source,created_at) VALUES($1,'v1','direct',($2::date::timestamp AT TIME ZONE 'Asia/Seoul')+($3::int*interval '1 second'))",
      [id, today, delta],
    );
    await db.query(
      "INSERT INTO study_events(run_id,name) VALUES($1,'start'),($1,'complete')",
      [id],
    );
  }
  const data = await snapshot(today, today);
  expect(data.participation[0]).toEqual({
    day: today,
    starts: 2,
    completions: 2,
  });
});
it("첫 캐릭터·미개봉·16종 완성·스킬 합집합·반복 실천·모션 굿즈를 구분한다", async () => {
  const id = await account("visual-solo-planned");
  const full = await account("auditory-solo-planned");
  await account();
  await db.query(
    "INSERT INTO collection_cards(account_id,type_code,source,opened_at,heart_reward) SELECT $1,character_code,'referral',now(),NULL FROM skill_catalog WHERE character_code IS NOT NULL ON CONFLICT DO NOTHING",
    [full],
  );
  await db.query(
    "INSERT INTO collection_cards(account_id,type_code,source) VALUES($1,'motion-team-flexible','referral')",
    [id],
  );
  await db.query(
    "INSERT INTO skill_unlocks(account_id,method,paid) VALUES($1,'outline',3),($1,'blank-page',1)",
    [id],
  );
  await db.query(
    "INSERT INTO skill_practices(account_id,method,status,elapsed) VALUES($1,'outline','completed',600),($1,'outline','completed',600),($1,'outline','cancelled',20)",
    [id],
  );
  await db.query(
    "INSERT INTO goods_unlocks(account_id,goods_id,paid) VALUES($1,'visual-solo-planned--motion-01',3)",
    [id],
  );
  await db.query(
    "INSERT INTO saved_study_results(run_id,account_id,version,type_code,session,scores,completed_at) VALUES($1,$2,'v1','motion-team-flexible','{}','{}',now())",
    [randomUUID(), id],
  );
  const data = await snapshot();
  expect(data.summary).toMatchObject({
    accounts: 3,
    registered: 2,
    cards: 17,
    pending: 1,
    complete: 1,
    average: 8.5,
    practices: 2,
    goods: 1,
  });
  expect(
    data.characters.find((c) => c.code === "motion-team-flexible"),
  ).toMatchObject({ firsts: 0, owners: 1, pending: 1 });
  expect(data.skills.find((s) => s.method === "outline")).toMatchObject({
    owners: 2,
    starts: 3,
    completions: 2,
    completers: 1,
  });
  expect(
    data.goods
      .filter((g) => g.kind === "motion")
      .reduce((n, g) => n + g.exchanges, 0),
  ).toBe(1);
  const detail = (
    await db.query<{
      data: { skills: string[]; account: { opened: number }; cards: unknown[] };
    }>(ADMIN_DETAIL_SQL, [id])
  ).rows[0].data;
  expect(detail.skills).toEqual(["blank-page", "outline"]);
  expect(detail.account.opened).toBe(1);
  expect(detail.cards).toHaveLength(2);
  expect(JSON.stringify(detail)).not.toMatch(
    /kakao_id|invite_code|scores|session|answers/,
  );
  await db.query("DELETE FROM collection_accounts WHERE id=$1", [id]);
  expect((await snapshot()).summary).toMatchObject({
    accounts: 2,
    cards: 16,
    pending: 0,
    practices: 0,
    goods: 0,
  });
});
it("계정 필터·정렬·빈 페이지에서도 총수를 반환하고 상세에서 비밀 값을 제외한다", async () => {
  const id = await account("visual-solo-planned");
  for (let n = 0; n < 51; n++) await account();
  const first = (
    await db.query<{ data: { total: number; rows: { id: string }[] } }>(
      ADMIN_ACCOUNTS_SQL,
      ["", "", "all", "cards", 50, 0],
    )
  ).rows[0].data;
  expect(first.total).toBe(52);
  expect(first.rows).toHaveLength(50);
  expect(first.rows[0].id).toBe(id);
  const second = (
    await db.query<{ data: { total: number; rows: unknown[] } }>(
      ADMIN_ACCOUNTS_SQL,
      ["", "", "all", "cards", 50, 50],
    )
  ).rows[0].data;
  expect(second.rows).toHaveLength(2);
  const empty = (
    await db.query<{ data: { total: number; rows: unknown[] } }>(
      ADMIN_ACCOUNTS_SQL,
      ["", "", "all", "cards", 50, 100],
    )
  ).rows[0].data;
  expect(empty).toEqual(expect.objectContaining({ total: 52, rows: [] }));
  const filtered = (
    await db.query<{ data: { total: number; rows: unknown[] } }>(
      ADMIN_ACCOUNTS_SQL,
      [id.slice(0, 8), "visual-solo-planned", "collecting", "newest", 50, 0],
    )
  ).rows[0].data;
  expect(filtered.total).toBe(1);
});

it("장기 조회는 월별 합계를 반환하고 부분 월·연도·한국 시간 경계를 지킨다", async () => {
  await db.exec(`INSERT INTO study_daily(day,version,source,metric,detail,total) VALUES
 ('2024-12-14','v1','qr','start','',100),
 ('2024-12-15','v1','qr','start','',2),
 ('2024-12-20','v1','qr','start','',8),
 ('2024-12-20','v1','qr','complete','',2),
 ('2025-01-01','v1','direct','start','',4),
 ('2025-04-10','v1','qr','start','',3),
 ('2025-04-11','v1','qr','start','',100)`);
  const id = randomUUID();
  await db.query(
    "INSERT INTO study_sessions(run_id,version,source,created_at,expires_at) VALUES($1,'v1','qr','2024-12-31T15:00:00Z',now()+interval '1 day')",
    [id],
  );
  await db.query(
    "INSERT INTO study_events(run_id,name) VALUES($1,'start'),($1,'complete')",
    [id],
  );
  const owner = await account();
  await db.query(
    "UPDATE collection_accounts SET created_at='2024-12-31T15:00:00Z' WHERE id=$1",
    [owner],
  );
  const data = await snapshot("2024-12-15", "2025-04-10");
  expect(data.participation).toEqual([
    { day: "2024-12-01", starts: 10, completions: 2 },
    { day: "2025-01-01", starts: 5, completions: 1 },
    { day: "2025-04-01", starts: 3, completions: 0 },
  ]);
  expect(data.activity).toEqual([
    { day: "2025-01-01", accounts: 1, registrations: 0, cards: 0, goods: 0 },
  ]);
  const all = await snapshot("0001-01-01", "2025-04-10");
  expect(all.participation.reduce((n, row) => n + row.starts, 0)).toBe(118);
  expect((await snapshot("2024-12-15", "2024-12-20")).participation).toEqual([
    { day: "2024-12-15", starts: 2, completions: 0 },
    { day: "2024-12-20", starts: 8, completions: 2 },
  ]);
});
