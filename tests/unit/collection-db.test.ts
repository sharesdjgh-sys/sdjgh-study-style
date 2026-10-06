import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { STUDY_TYPES } from "../../src/lib/content";
let db: PGlite;
let sequence = 0;
beforeAll(async () => {
  db = new PGlite();
  for (const file of [
    "001_analytics.sql",
    "002_retention.sql",
    "003_collections.sql",
    "004_saved_results.sql",
    "005_account_lifecycle.sql",
    "006_skill_hearts.sql",
  ])
    await db.exec(await readFile(`db/${file}`, "utf8"));
}, 60000);
beforeEach(async () => {
  await db.exec("TRUNCATE collection_accounts CASCADE");
});
afterAll(async () => {
  await db.close();
});
async function createAccount() {
  const n = ++sequence;
  const code = n.toString(16).padStart(10, "0").toUpperCase();
  const id = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
    [id, String(n), code],
  );
  return { id, code };
}
async function register(
  id: string,
  type = STUDY_TYPES[0].code,
  invite: string | null = null,
  run = randomUUID(),
) {
  return (
    await db.query<{ outcome: string }>(
      "SELECT register_collection($1,$2,$3,$4) AS outcome",
      [id, run, type, invite],
    )
  ).rows[0].outcome;
}
async function cards(id: string) {
  return (
    await db.query<{
      type_code: string;
      source: string;
      opened_at: string | null;
    }>("SELECT * FROM collection_cards WHERE account_id=$1", [id])
  ).rows;
}
it("최초 캐릭터는 한 번만 저장되며 재등록으로 바뀌지 않는다", async () => {
  const a = await createAccount();
  expect(await register(a.id)).toBe("registered");
  expect(await register(a.id, STUDY_TYPES[15].code)).toBe("already_registered");
  expect(await cards(a.id)).toMatchObject([
    { type_code: STUDY_TYPES[0].code, source: "first" },
  ]);
  expect((await cards(a.id))[0].opened_at).not.toBeNull();
});
it("친구 첫 등록만 보상하고 같은 친구를 다른 추천인으로 재등록하지 않는다", async () => {
  const a = await createAccount(),
    b = await createAccount(),
    c = await createAccount();
  await register(a.id);
  await register(c.id);
  expect(await register(b.id, STUDY_TYPES[1].code, a.code)).toBe("referred");
  expect(await cards(a.id)).toHaveLength(2);
  expect(
    (await cards(a.id)).find((c) => c.source === "referral")?.opened_at,
  ).toBeNull();
  expect(await register(b.id, STUDY_TYPES[2].code, c.code)).toBe(
    "already_registered",
  );
  expect(await cards(c.id)).toHaveLength(1);
  const bCards = await cards(b.id);
  expect(bCards).toHaveLength(2);
  expect(bCards.every((card) => card.opened_at)).toBe(true);
  expect(new Set(bCards.map((card) => card.type_code)).size).toBe(2);
});
it("존재하지 않는 추천과 같은 검사 결과의 타 계정 재사용을 거부한다", async () => {
  const a = await createAccount(),
    b = await createAccount();
  expect(await register(a.id, STUDY_TYPES[0].code, "FFFFFFFFFF")).toBe(
    "invalid_invite",
  );
  expect(await cards(a.id)).toHaveLength(0);
  const run = randomUUID();
  await register(a.id, STUDY_TYPES[0].code, null, run);
  expect(await register(b.id, STUDY_TYPES[1].code, a.code, run)).toBe(
    "run_claimed",
  );
  expect(await cards(a.id)).toHaveLength(1);
  expect(await cards(b.id)).toHaveLength(0);
});
it("여러 추천 요청 후 중복 없이 16장을 완성하고 이후 보상을 만들지 않는다", async () => {
  const a = await createAccount();
  await register(a.id);
  const friends = await Promise.all(
    Array.from({ length: 20 }, () => createAccount()),
  );
  await Promise.all(
    friends
      .slice(0, 14)
      .map((b) => register(b.id, STUDY_TYPES[0].code, a.code)),
  );
  expect(await cards(a.id)).toHaveLength(15);
  await register(friends[14].id, STUDY_TYPES[0].code, a.code);
  const result = await cards(a.id);
  expect(result).toHaveLength(16);
  expect(new Set(result.map((c) => c.type_code)).size).toBe(16);
  expect(result.filter((c) => c.source === "referral")).toHaveLength(15);
  await Promise.all(
    friends.slice(15).map((b) => register(b.id, STUDY_TYPES[0].code, a.code)),
  );
  expect(await cards(a.id)).toHaveLength(16);
  await Promise.all(
    friends.map((b) => register(b.id, STUDY_TYPES[1].code, a.code)),
  );
  expect(await cards(a.id)).toHaveLength(16);
  expect(
    (
      await db.query("SELECT * FROM collection_referrals WHERE inviter_id=$1", [
        a.id,
      ])
    ).rows,
  ).toHaveLength(20);
});
it("기존 7일 통계 정리가 도감을 지우지 않고 계정 삭제는 관련 데이터만 지운다", async () => {
  const a = await createAccount(),
    b = await createAccount();
  await register(a.id);
  await register(b.id, STUDY_TYPES[0].code, a.code);
  await db.query(
    "UPDATE collection_accounts SET created_at=now()-interval '100 days'",
  );
  await db.exec("SELECT study_rollup()");
  expect(await cards(a.id)).toHaveLength(2);
  expect(await cards(b.id)).toHaveLength(2);
  await db.query(
    "INSERT INTO collection_sessions VALUES('token',$1,now()+interval '30 days')",
    [b.id],
  );
  await db.query("DELETE FROM collection_accounts WHERE id=$1", [b.id]);
  expect(await cards(b.id)).toHaveLength(0);
  expect(await cards(a.id)).toHaveLength(2);
  expect(
    (await db.query("SELECT * FROM collection_sessions")).rows,
  ).toHaveLength(0);
  expect(
    (await db.query("SELECT invitee_id FROM collection_referrals")).rows[0],
  ).toMatchObject({ invitee_id: null });
});
it("타인의 선물은 열 수 없고 같은 선물을 다시 열어도 결과가 바뀌지 않는다", async () => {
  const a = await createAccount(),
    b = await createAccount();
  await register(a.id);
  await register(b.id, STUDY_TYPES[0].code, a.code);
  const gift = (
    await db.query<{ reward_id: string }>(
      "SELECT reward_id FROM collection_cards WHERE account_id=$1 AND source='referral'",
      [a.id],
    )
  ).rows[0].reward_id;
  const open = (id: string) =>
    db.query(
      "UPDATE collection_cards SET opened_at=COALESCE(opened_at,now()) WHERE account_id=$1 AND reward_id=$2 RETURNING type_code,opened_at",
      [id, gift],
    );
  expect((await open(b.id)).rows).toHaveLength(0);
  expect((await open(a.id)).rows).toEqual((await open(a.id)).rows);
});
