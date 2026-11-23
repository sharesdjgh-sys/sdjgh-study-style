import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
it("예산과 지급 번호를 보존하고 모션과 중복 지급을 제외한다", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile("db/003_collections.sql", "utf8"));
    await db.exec(await readFile("db/018_sdj_qr_reward.sql", "utf8"));
    await db.exec(
      "CREATE TABLE goods_unlocks(account_id uuid REFERENCES collection_accounts,goods_id text,PRIMARY KEY(account_id,goods_id))",
    );
    const migration = await readFile("db/019_sdj_prize_cards.sql", "utf8");
    await db.exec(migration);
    const inventory = await db.query(
      "SELECT number,design FROM sdj_prize_cards ORDER BY number",
    );
    await db.exec(migration);
    expect(
      (
        await db.query(
          "SELECT number,design FROM sdj_prize_cards ORDER BY number",
        )
      ).rows,
    ).toEqual(inventory.rows);
    expect(
      (
        await db.query(
          "SELECT count(*)::int n,sum(vouchers)::int v FROM sdj_prize_cards",
        )
      ).rows,
    ).toEqual([{ n: 29, v: 50 }]);
    await db.exec(
      "INSERT INTO collection_accounts(kakao_id,invite_code) VALUES('1','1'),('2','2');INSERT INTO sdj_qr_rewards(account_id) SELECT id FROM collection_accounts",
    );
    await db.exec(
      "INSERT INTO goods_unlocks SELECT id,'motion-team-flexible--motion-01' FROM collection_accounts",
    );
    expect(
      (
        await db.query(
          "SELECT number FROM sdj_prize_cards WHERE issued_at IS NOT NULL",
        )
      ).rows,
    ).toHaveLength(0);
    const claim = (kakaoId: string) => db.query(
      "INSERT INTO goods_unlocks SELECT a.id,p.design FROM collection_accounts a CROSS JOIN sdj_prize_cards p WHERE a.kakao_id=$1 AND p.kind IN ('daily','special')",
      [kakaoId],
    );
    const owners = () => db.query<{ number: number; account_id: string | null; issued_at: Date | null }>(
      "SELECT number,account_id,issued_at FROM sdj_prize_cards WHERE kind IN ('daily','special') ORDER BY number",
    );
    await claim("1");
    const assigned = (await owners()).rows;
    expect(assigned).toHaveLength(24);
    expect(assigned.every(row => row.account_id && row.issued_at)).toBe(true);
    await claim("2");
    expect((await owners()).rows).toEqual(assigned);
    await db.exec(
      "INSERT INTO collection_cards(account_id,type_code,source,opened_at) SELECT a.id,m||'-'||s||'-'||p,'referral',now() FROM collection_accounts a CROSS JOIN unnest(ARRAY['visual','auditory','tactile','motion']) m CROSS JOIN unnest(ARRAY['solo','team']) s CROSS JOIN unnest(ARRAY['planned','flexible']) p",
    );
    expect(
      (
        await db.query(
          "SELECT count(*)::int n,sum(vouchers)::int v FROM sdj_prize_cards WHERE issued_at IS NOT NULL",
        )
      ).rows,
    ).toEqual([{ n: 29, v: 50 }]);
    await db.exec(
      "UPDATE sdj_prize_cards SET paid_at=now() WHERE number=29 AND paid_at IS NULL",
    );
    expect(
      (
        await db.query(
          "SELECT paid_vouchers::int v FROM sdj_prize_totals WHERE kind='full'",
        )
      ).rows,
    ).toEqual([{ v: 5 }]);
  } finally {
    await db.close();
  }
}, 60000);
