import { database } from "./db";
import type { GoodsProgress } from "./goods";
export async function goodsProgress(accountId: string): Promise<GoodsProgress> {
  const sql = database();
  const [accounts, owned, entries, families] = await Promise.all([
    sql`SELECT star_balance FROM collection_accounts WHERE id=${accountId}::uuid`,
    sql`SELECT goods_id FROM goods_unlocks WHERE account_id=${accountId}::uuid`,
    sql`SELECT id,amount,reason,reference,created_at AS "createdAt" FROM star_ledger WHERE account_id=${accountId}::uuid ORDER BY created_at DESC,id DESC LIMIT 100`,
    sql`SELECT reference FROM star_ledger WHERE account_id=${accountId}::uuid AND reason='family'`,
  ]);
  return {
    balance: Number(accounts[0]?.star_balance ?? 0),
    owned: owned.map((r) => String(r.goods_id)),
    entries: entries as GoodsProgress["entries"],
    families: families.map((r) => String(r.reference)),
  };
}
