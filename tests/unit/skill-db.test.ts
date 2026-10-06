import { beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { METHOD_IDS, methodOwner } from "../../src/lib/methods";
import { skillPrice, EFFECT_QUESTIONS } from "../../src/lib/skill-economy";
let db: PGlite;
let migration: string;
beforeAll(async () => {
  db = new PGlite();
  for (const file of ["003_collections.sql", "005_account_lifecycle.sql"])
    await db.exec(await readFile("db/" + file, "utf8"));
  migration = await readFile("db/006_skill_hearts.sql", "utf8");
  await db.exec(migration);
}, 60000);
afterAll(async () => {
  await db.close();
});
beforeEach(async () => {
  await db.exec("TRUNCATE collection_accounts CASCADE");
  await db.exec(await readFile("db/007_home_screen_rewards.sql", "utf8"));
});
async function account() {
  const id = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
    [id, id, id],
  );
  return id;
}
async function scalar<T = string>(sql: string, args: unknown[] = []) {
  return (await db.query<{ v: T }>(sql, args)).rows[0].v;
}
async function balance(id: string) {
  return scalar<number>(
    "SELECT heart_balance AS v FROM collection_accounts WHERE id=$1",
    [id],
  );
}
async function card(id: string, code = "visual-solo-planned", opened = true) {
  await db.query(
    "INSERT INTO collection_cards(account_id,type_code,source,opened_at) VALUES($1,$2,'referral',CASE WHEN $3 THEN now() END)",
    [id, code, opened],
  );
}
async function fund(id: string) {
  await db.query("SELECT credit_hearts($1,'install','mobile-pwa',3)", [id]);
}
it("바로가기 1개 후 설치 2개, 사용 후에도 중복 지급하지 않는다", async () => {
  const id = await account();
  const claim = (reason: string, reference = "arbitrary") =>
    scalar<number>("SELECT credit_hearts($1,$2,$3,99) AS v", [
      id,
      reason,
      reference,
    ]);
  expect(await claim("shortcut")).toBe(1);
  expect(await claim("shortcut", "retry")).toBe(0);
  await db.query("SELECT unlock_skill($1,'blank-page')", [id]);
  expect(await balance(id)).toBe(0);
  expect(await claim("install")).toBe(2);
  expect(await claim("install", "retry")).toBe(0);
  expect(await claim("shortcut")).toBe(0);
  expect(await balance(id)).toBe(2);
  await db.exec(await readFile("db/007_home_screen_rewards.sql", "utf8"));
  expect(await claim("install")).toBe(0);
});
it("기존 설치 보상 3개와 설치 먼저 받기는 바로가기로 중복 보상하지 않는다", async () => {
  const id = await account();
  await db.exec(migration);
  await fund(id);
  await db.exec(await readFile("db/007_home_screen_rewards.sql", "utf8"));
  expect(
    await scalar<number>(
      "SELECT credit_hearts($1,'shortcut','home-shortcut',1) AS v",
      [id],
    ),
  ).toBe(0);
  expect(await balance(id)).toBe(3);
  const other = await account();
  await fund(other);
  expect(
    await scalar<number>(
      "SELECT credit_hearts($1,'shortcut','home-shortcut',1) AS v",
      [other],
    ),
  ).toBe(0);
  expect(await balance(other)).toBe(3);
});
it("DB 비용표와 28개 스킬·효과 질문이 일치한다", async () => {
  const rows = (
    await db.query<{
      method: string;
      cost: number;
      character_code: string | null;
    }>("SELECT * FROM skill_catalog")
  ).rows;
  expect(rows).toHaveLength(28);
  for (const id of METHOD_IDS) {
    const row = rows.find((r) => r.method === id)!;
    const owner = methodOwner(id);
    expect(row.cost).toBe(skillPrice(id));
    expect(row.character_code).toBe(
      owner.kind === "signature" ? owner.code : null,
    );
    expect(EFFECT_QUESTIONS[id]).toBeTruthy();
  }
});
it("미개봉에는 지급하지 않고 개봉 시 1~3개, 반복 개봉에는 재지급하지 않는다", async () => {
  const id = await account();
  await card(id, "visual-solo-planned", false);
  expect(await balance(id)).toBe(0);
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
    [id],
  );
  const first = await balance(id);
  expect(first).toBeGreaterThanOrEqual(1);
  expect(first).toBeLessThanOrEqual(3);
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
    [id],
  );
  expect(await balance(id)).toBe(first);
  expect(
    await scalar<boolean>("SELECT skill_is_open($1,'outline') AS v", [id]),
  ).toBe(true);
});
it("기존 공개 카드는 소급 보상하지 않고 반복 마이그레이션도 재지급하지 않는다", async () => {
  const id = await account();
  await db.query(
    "INSERT INTO collection_cards(account_id,type_code,source,opened_at,heart_reward) VALUES($1,'visual-solo-planned','first',now(),NULL)",
    [id],
  );
  await db.exec(migration);
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
    [id],
  );
  expect(await balance(id)).toBe(0);
  expect(
    await scalar<boolean>("SELECT skill_is_open($1,'outline') AS v", [id]),
  ).toBe(true);
});
it("중복 설치와 중복 구매를 막고 잔액 부족 시 차감하지 않는다", async () => {
  const id = await account();
  await Promise.all([fund(id), fund(id)]);
  expect(await balance(id)).toBe(3);
  const results = await Promise.all([
    scalar("SELECT unlock_skill($1,'cornell') AS v", [id]),
    scalar("SELECT unlock_skill($1,'cornell') AS v", [id]),
  ]);
  expect(results.sort()).toEqual(["already_open", "unlocked"]);
  expect(await balance(id)).toBe(1);
  expect(await scalar("SELECT unlock_skill($1,'feynman') AS v", [id])).toBe(
    "insufficient_hearts",
  );
  expect(await balance(id)).toBe(1);
});
it("하트로 연 시그니처 카드 획득 시 3개를 한 번 환급한다", async () => {
  const id = await account();
  await fund(id);
  expect(await scalar("SELECT unlock_skill($1,'outline') AS v", [id])).toBe(
    "unlocked",
  );
  await card(id);
  const amount = await balance(id);
  expect(amount).toBeGreaterThanOrEqual(4);
  expect(amount).toBeLessThanOrEqual(6);
  expect(
    await scalar<number>(
      "SELECT count(*)::int AS v FROM heart_ledger WHERE account_id=$1 AND reason='refund'",
      [id],
    ),
  ).toBe(1);
  await db.query(
    "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
    [id],
  );
  expect(await balance(id)).toBe(amount);
});
async function action(
  id: string,
  action: string,
  method: string | null = null,
  run: string | null = null,
  answers: unknown = null,
) {
  return scalar<{ error?: string; awarded?: number }>(
    "SELECT practice_action($1,$2,$3,$4,$5::jsonb) AS v",
    [
      id,
      action,
      method,
      run,
      answers === null ? null : JSON.stringify(answers),
    ],
  );
}
async function active(id: string) {
  return scalar(
    "SELECT id AS v FROM skill_practices WHERE account_id=$1 AND status IN ('running','paused')",
    [id],
  );
}
it("잠긴 실천·동시 실천·10분 전 완료·누락 응답을 거절한다", async () => {
  const id = await account();
  expect((await action(id, "start", "cornell")).error).toBe("locked");
  await card(id);
  await fund(id);
  await scalar("SELECT unlock_skill($1,'cornell') AS v", [id]);
  await action(id, "start", "outline");
  const run = await active(id);
  expect((await action(id, "start", "cornell")).error).toBe("active_practice");
  expect((await action(id, "complete", null, run, [0, 0, 0])).error).toBe(
    "too_early",
  );
  await db.query(
    "UPDATE skill_practices SET updated_at=now()-interval '601 seconds' WHERE id=$1",
    [run],
  );
  expect((await action(id, "complete", null, run, [0])).error).toBe("answers");
  expect((await action(id, "complete", null, run, [0, 4, 0])).error).toBe(
    "answers",
  );
});
it("부정 응답도 보상하며 같은 스킬은 다시 실천해도 첫 한 번만 지급한다", async () => {
  const id = await account();
  await card(id);
  const initial = await balance(id);
  for (let i = 0; i < 2; i++) {
    await action(id, "start", "outline");
    const run = await active(id);
    await db.query(
      "UPDATE skill_practices SET updated_at=now()-interval '601 seconds' WHERE id=$1",
      [run],
    );
    expect((await action(id, "complete", null, run, [3, 3, 3])).awarded).toBe(
      i === 0 ? 1 : 0,
    );
    expect((await action(id, "complete", null, run, [3, 3, 3])).awarded).toBe(
      0,
    );
  }
  expect(await balance(id)).toBe(initial + 1);
});
it("일시정지 시간은 제외하고 다른 계정의 실천과 취소 기록에는 보상하지 않는다", async () => {
  const id = await account();
  const other = await account();
  await card(id);
  await action(id, "start", "outline");
  const run = await active(id);
  await action(id, "pause", null, run);
  await db.query(
    "UPDATE skill_practices SET updated_at=now()-interval '700 seconds' WHERE id=$1",
    [run],
  );
  expect((await action(id, "complete", null, run, [0, 0, 0])).error).toBe(
    "too_early",
  );
  expect((await action(other, "complete", null, run, [0, 0, 0])).error).toBe(
    "not_found",
  );
  await action(id, "cancel", null, run);
  expect((await action(id, "complete", null, run, [0, 0, 0])).error).toBe(
    "cancelled",
  );
});
it("계정 삭제 시 하트와 해제·실천 기록이 함께 삭제된다", async () => {
  const id = await account();
  await fund(id);
  await card(id);
  await scalar("SELECT unlock_skill($1,'cornell') AS v", [id]);
  await action(id, "start", "outline");
  await db.query("DELETE FROM collection_accounts WHERE id=$1", [id]);
  for (const table of ["heart_ledger", "skill_unlocks", "skill_practices"])
    expect(
      await scalar<number>("SELECT count(*)::int AS v FROM " + table),
    ).toBe(0);
});
