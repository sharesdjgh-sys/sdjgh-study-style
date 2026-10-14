import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile("db/001_analytics.sql", "utf8"));
  await db.exec(await readFile("db/002_retention.sql", "utf8"));
  await db.exec(await readFile("db/012_analytics_history.sql", "utf8"));
}, 30000);
afterAll(async () => {
  await db.close();
});
it("실제 PostgreSQL에서 중복 제거·원본 삭제·장기 집계 보존를 검증한다", async () => {
  const id = "123e4567-e89b-42d3-a456-426614174000";
  await db.query(
    "INSERT INTO study_sessions(run_id,version,source,created_at,expires_at) VALUES($1,'v1','qr',now()-interval '8 days',now()-interval '1 day')",
    [id],
  );
  await db.query(
    "INSERT INTO study_events(run_id,name,slot,detail) VALUES($1,'start','',''),($1,'complete','',''),($1,'share','copy','copy'),($1,'share','kakao','kakao')",
    [id],
  );
  await db.query(
    "INSERT INTO study_events(run_id,name,slot,detail) VALUES($1,'complete','','') ON CONFLICT DO NOTHING",
    [id],
  );
  await db.exec(
    "INSERT INTO study_daily(day,version,source,metric,detail,total) VALUES(current_date-100,'old','direct','start','',5)",
  );
  await db.exec("SELECT study_rollup()");
  expect((await db.query("SELECT * FROM study_sessions")).rows).toHaveLength(0);
  expect((await db.query("SELECT * FROM study_events")).rows).toHaveLength(0);
  expect(
    (
      await db.query<{ total: number }>(
        "SELECT total FROM study_daily WHERE metric='complete'",
      )
    ).rows[0].total,
  ).toBe(1);
  expect(
    (
      await db.query<{ total: number }>(
        "SELECT total FROM study_daily WHERE metric='share_any'",
      )
    ).rows[0].total,
  ).toBe(1);
  expect(
    (await db.query("SELECT * FROM study_daily WHERE version='old'")).rows,
  ).toHaveLength(1);
  await db.exec("SELECT study_rollup()");
  expect(
    (
      await db.query<{ total: number }>(
        "SELECT total FROM study_daily WHERE metric='complete'",
      )
    ).rows[0].total,
  ).toBe(1);
});
it("미완료 검사에서 마지막 문항만 이탈 위치로 집계한다", async () => {
  const id = "123e4567-e89b-42d3-a456-426614174001";
  await db.query(
    "INSERT INTO study_sessions(run_id,version,source,created_at,expires_at) VALUES($1,'v1','qr',now()-interval '8 days',now()-interval '1 day')",
    [id],
  );
  await db.query(
    "INSERT INTO study_events(run_id,name,slot,detail) VALUES($1,'question','1','1'),($1,'question','2','2')",
    [id],
  );
  await db.exec("SELECT study_rollup()");
  expect(
    (
      await db.query<{ detail: string }>(
        "SELECT detail FROM study_daily WHERE metric='last_question'",
      )
    ).rows[0].detail,
  ).toBe("2");
});

it("90일 넘게 지연된 원본도 집계로 보존하고 정책을 재적용해도 중복되지 않는다", async () => {
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO study_sessions(run_id,version,source,created_at,expires_at) VALUES($1,'delayed','direct',now()-interval '400 days',now()-interval '393 days')",
    [id],
  );
  await db.query(
    "INSERT INTO study_events(run_id,name) VALUES($1,'start'),($1,'complete')",
    [id],
  );
  for (let i = 0; i < 2; i++) {
    await db.exec(await readFile("db/012_analytics_history.sql", "utf8"));
    await db.exec("SELECT study_rollup()");
  }
  expect(
    (
      await db.query(
        "SELECT metric,total FROM study_daily WHERE version='delayed' ORDER BY metric",
      )
    ).rows,
  ).toEqual([
    { metric: "complete", total: 1 },
    { metric: "start", total: 1 },
  ]);
  expect(
    (await db.query("SELECT total FROM study_daily WHERE version='old'")).rows,
  ).toEqual([{ total: 5 }]);
  expect(
    (await db.query("SELECT * FROM study_sessions WHERE run_id=$1", [id])).rows,
  ).toHaveLength(0);
});
