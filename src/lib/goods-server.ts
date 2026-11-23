import { database } from "./db";
import type { GoodsProgress } from "./goods";
export async function goodsProgress(accountId: string): Promise<GoodsProgress> {
  const sql = database();
  const [accounts, owned, entries, families, prizes] = await Promise.all([
    sql`SELECT star_balance FROM collection_accounts WHERE id=${accountId}::uuid`,
    sql`SELECT goods_id,equipped FROM goods_unlocks WHERE account_id=${accountId}::uuid`,
    sql`SELECT id,amount,reason,reference,created_at AS "createdAt" FROM star_ledger WHERE account_id=${accountId}::uuid ORDER BY created_at DESC,id DESC LIMIT 100`,
    sql`SELECT reference FROM star_ledger WHERE account_id=${accountId}::uuid AND reason='family'`,
    sql`SELECT design,number FROM sdj_prize_cards WHERE account_id=${accountId}::uuid`,
  ]);
  return {
    prizeNumbers: Object.fromEntries(
      prizes.map((r) => [r.design, Number(r.number)]),
    ),
    equipped: owned.filter((r) => r.equipped).map((r) => String(r.goods_id)),
    balance: Number(accounts[0]?.star_balance ?? 0),
    owned: owned.map((r) => String(r.goods_id)),
    entries: entries as GoodsProgress["entries"],
    families: families.map((r) => String(r.reference)),
  };
}
