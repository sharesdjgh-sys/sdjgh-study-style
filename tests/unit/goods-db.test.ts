import { beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { GOODS, goodsPrice } from "../../src/lib/goods";
let db: PGlite;
let migration: string;
beforeAll(async () => {
  db = new PGlite();
  for (const file of [
    "003_collections.sql",
    "005_account_lifecycle.sql",
    "006_skill_hearts.sql",
    "007_home_screen_rewards.sql",
  ])
    await db.exec(await readFile("db/" + file, "utf8"));
  migration = await readFile("db/008_goods_stars.sql", "utf8");
  await db.exec(migration);
}, 60000);
afterAll(async () => {
  await db.close();
});
beforeEach(async () => {
  await db.exec("TRUNCATE collection_accounts CASCADE");
});
async function scalar<T = string>(sql: string, args: unknown[] = []) {
  return (await db.query<{ v: T }>(sql, args)).rows[0].v;
}
async function account() {
  const id = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
    [id,id,id],
  );
  return id;
}
async function card(id: string, code = "visual-solo-planned", opened = true) {
  await db.query(
    "INSERT INTO collection_cards(account_id,type_code,source,opened_at) VALUES($1,$2,'referral',CASE WHEN $3 THEN now() END)",
    [id, code, opened],
  );
}
const balance = (id: string) =>
  scalar<number>(
    "SELECT star_balance AS v FROM collection_accounts WHERE id=$1",
    [id],
  );
const redeem = (id: string, goods = "visual-solo-planned--daily-01") =>
  scalar("SELECT redeem_goods($1,$2) AS v", [id, goods]);
it("128종 서버 비용은 일상 1별·특별 의상 2별이며 클라이언트 목록과 일치한다", async () => {
  const rows = (
    await db.query<{ id: string; cost: number; character_code: string }>(
      "SELECT * FROM goods_catalog",
    )
  ).rows;
  expect(rows).toHaveLength(128);
  for (const c of GOODS)
    expect(rows.find((r) => r.id === c.id)).toMatchObject({
      cost: goodsPrice(c),
      character_code: c.code,
    });
});
it("미개봉·미보유는 교환 불가, 부족한 별은 차감하지 않고 중복 교환은 한 번만 차감한다", async () => {
  const id = await account();
  await card(id, undefined, false);
  expect(await redeem(id)).toBe("character_required");
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
    [id],
  );
  expect(await redeem(id)).toBe("insufficient_stars");
  await db.query("SELECT credit_stars($1,'practice','outline',1)", [id]);
  expect((await Promise.all([redeem(id), redeem(id)])).sort()).toEqual([
    "already_owned",
    "redeemed",
  ]);
  expect(await balance(id)).toBe(0);
  expect(await redeem(id, "visual-solo-planned--special-01")).toBe(
    "insufficient_stars",
  );
  const other = await account();
  expect(await redeem(other)).toBe("character_required");
  expect(await redeem(id, "invalid")).toBe("not_found");
});
it("유형별 4명 개봉 시만 3별을 지급하고 재개봉·마이그레이션 재실행으로 중복 지급하지 않는다", async () => {
  const id = await account();
  const codes = [
    "solo-planned",
    "solo-flexible",
    "team-planned",
    "team-flexible",
  ];
  for (const suffix of codes)
    await card(id, "visual-" + suffix, suffix !== "team-flexible");
  expect(await balance(id)).toBe(0);
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1 AND type_code='visual-team-flexible'",
    [id],
  );
  expect(await balance(id)).toBe(3);
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
    [id],
  );
  await db.exec(migration);
  expect(await balance(id)).toBe(3);
  for (const suffix of codes) await card(id, "auditory-" + suffix);
  expect(await balance(id)).toBe(6);
});
it("10분과 세 응답을 검증하고 같은 스킬의 첫 완료만 별을 지급하며 하트는 변하지 않는다", async () => {
  const id = await account();
  await card(id);
  const hearts = await scalar<number>(
    "SELECT heart_balance AS v FROM collection_accounts WHERE id=$1",
    [id],
  );
  for (let i = 0; i < 2; i++) {
    await db.query("SELECT practice_action($1,'start','outline')", [id]);
    const run = await scalar(
      "SELECT id AS v FROM skill_practices WHERE account_id=$1 AND status='running'",
      [id],
    );
    const complete = (answers: string) =>
      scalar<{ error?: string; awarded?: number }>(
        "SELECT practice_action($1,'complete',NULL,$2,$3::jsonb) AS v",
        [id, run, answers],
      );
    expect((await complete("[3,3,3]")).error).toBe("too_early");
    await db.query(
      "UPDATE skill_practices SET updated_at=now()-interval '601 seconds' WHERE id=$1",
      [run],
    );
    expect((await complete("[0]")).error).toBe("answers");
    expect((await complete("[3,3,3]")).awarded).toBe(i === 0 ? 1 : 0);
    expect((await complete("[3,3,3]")).awarded).toBe(0);
  }
  expect(await balance(id)).toBe(1);
  expect(
    await scalar<number>(
      "SELECT heart_balance AS v FROM collection_accounts WHERE id=$1",
      [id],
    ),
  ).toBe(hearts);
});
it("기존 완료에 별을 소급 지급하고 기존 하트와 소비한 별을 재실행 때 보존한다", async () => {
  const id = await account();
  await card(id);
  await db.query("SELECT credit_hearts($1,'practice','outline',1)", [id]);
  const hearts = await scalar<number>(
    "SELECT heart_balance AS v FROM collection_accounts WHERE id=$1",
    [id],
  );
  await db.exec(migration);
  expect(await balance(id)).toBe(1);
  await redeem(id);
  await db.exec(migration);
  expect(await balance(id)).toBe(0);
  expect(
    await scalar<number>(
      "SELECT heart_balance AS v FROM collection_accounts WHERE id=$1",
      [id],
    ),
  ).toBe(hearts);
  await db.query("DELETE FROM collection_accounts WHERE id=$1", [id]);
  for (const table of ["star_ledger", "goods_unlocks"])
    expect(
      await scalar<number>(`SELECT count(*)::int AS v FROM ${table}`),
    ).toBe(0);
});
