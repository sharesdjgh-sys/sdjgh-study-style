import { expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

it("카드 개봉 별은 1~2개로 고정되고 재개봉·재설치·소비 후에도 중복 지급되지 않는다", async () => {
  const db = new PGlite();
  try {
    for (const file of [
      "003_collections.sql",
      "005_account_lifecycle.sql",
      "006_skill_hearts.sql",
      "007_home_screen_rewards.sql",
      "008_goods_stars.sql",
    ])
      await db.exec(await readFile(`db/${file}`, "utf8"));
    const id = randomUUID();
    await db.query(
      "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
      [id, id, id],
    );
    const insert = (code: string, opened: boolean) =>
      db.query(
        "INSERT INTO collection_cards(account_id,type_code,source,opened_at) VALUES($1,$2,'referral',CASE WHEN $3 THEN now() END)",
        [id, code, opened],
      );
    await insert("visual-solo-planned", true);
    await insert("visual-solo-flexible", false);
    const migration = await readFile("db/009_card_stars.sql", "utf8");
    await db.exec(migration);
    const cards = async () =>
      (
        await db.query<{ type_code: string; star_reward: number | null }>(
          "SELECT type_code,star_reward FROM collection_cards WHERE account_id=$1 ORDER BY type_code",
          [id],
        )
      ).rows;
    expect(await cards()).toEqual([
      { type_code: "visual-solo-flexible", star_reward: 0 },
      { type_code: "visual-solo-planned", star_reward: null },
    ]);
    const open = () =>
      db.query(
        "UPDATE collection_cards SET opened_at=COALESCE(opened_at,now()) WHERE account_id=$1",
        [id],
      );
    await Promise.all([open(), open()]);
    const reward = (await cards())[0].star_reward!;
    expect([1, 2]).toContain(reward);
    expect((await cards())[1].star_reward).toBeNull();
    const balance = async () =>
      (
        await db.query<{ star_balance: number }>(
          "SELECT star_balance FROM collection_accounts WHERE id=$1",
          [id],
        )
      ).rows[0].star_balance;
    expect(await balance()).toBe(reward);
    expect(
      (
        await db.query(
          "SELECT amount,reference FROM star_ledger WHERE account_id=$1 AND reason='card'",
          [id],
        )
      ).rows,
    ).toEqual([{ amount: reward, reference: "visual-solo-flexible" }]);
    await db.query("SELECT redeem_goods($1,'visual-solo-flexible--daily-01')", [
      id,
    ]);
    await db.exec(migration);
    await open();
    expect(await balance()).toBe(reward - 1);
    expect((await cards())[0].star_reward).toBe(reward);
    await insert("visual-team-planned", true);
    await insert("visual-team-flexible", true);
    const cardTotal = (await cards()).reduce((sum, card) => {
      if (card.star_reward !== null) expect([1, 2]).toContain(card.star_reward);
      return sum + (card.star_reward ?? 0);
    }, 0);
    expect(await balance()).toBe(cardTotal - 1 + 3);
    expect(
      (
        await db.query(
          "SELECT amount FROM star_ledger WHERE account_id=$1 AND reason='family'",
          [id],
        )
      ).rows,
    ).toEqual([{ amount: 3 }]);
    expect(
      (
        await db.query("SELECT skill_is_open($1,'dual-coding') AS unlocked", [
          id,
        ])
      ).rows,
    ).toEqual([{ unlocked: true }]);
    expect(
      (
        await db.query(
          "SELECT amount FROM heart_ledger WHERE account_id=$1 AND reason='card'",
          [id],
        )
      ).rows,
    ).toHaveLength(4);
    const first = randomUUID();
    await db.query(
      "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
      [first, first, first],
    );
    await db.query("SELECT register_collection($1,$2,'visual-solo-planned')", [
      first,
      randomUUID(),
    ]);
    const firstStars = (
      await db.query<{ star_balance: number }>(
        "SELECT star_balance FROM collection_accounts WHERE id=$1",
        [first],
      )
    ).rows[0].star_balance;
    expect([1, 2]).toContain(firstStars);
    await db.query("SELECT register_collection($1,$2,'visual-solo-planned')", [
      first,
      randomUUID(),
    ]);
    expect(
      (
        await db.query(
          "SELECT star_balance FROM collection_accounts WHERE id=$1",
          [first],
        )
      ).rows,
    ).toEqual([{ star_balance: firstStars }]);
    await db.query("DELETE FROM collection_accounts WHERE id=$1", [id]);
    expect(
      (await db.query("SELECT * FROM star_ledger WHERE account_id=$1", [id]))
        .rows,
    ).toHaveLength(0);
  } finally {
    await db.close();
  }
}, 60000);
