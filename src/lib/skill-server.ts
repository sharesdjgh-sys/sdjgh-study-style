import { database } from "./db";
import type { SkillProgress } from "./skill-economy";

export async function skillProgress(accountId: string): Promise<SkillProgress> {
  const sql = database();
  const [accounts, unlocked, entries, rewards, practices] = await Promise.all([
    sql`SELECT heart_balance FROM collection_accounts WHERE id=${accountId}::uuid`,
    sql`SELECT method FROM skill_catalog WHERE skill_is_open(${accountId}::uuid,method)`,
    sql`SELECT id,amount,reason,reference,created_at AS "createdAt" FROM heart_ledger WHERE account_id=${accountId}::uuid ORDER BY created_at DESC,id DESC LIMIT 80`,
    sql`SELECT reason,reference FROM heart_ledger WHERE account_id=${accountId}::uuid AND reason IN ('install','shortcut') UNION SELECT reason,reference FROM star_ledger WHERE account_id=${accountId}::uuid AND reason='practice'`,
    sql`SELECT id,method,status,LEAST(600,elapsed+CASE WHEN status='running' THEN GREATEST(0,extract(epoch FROM clock_timestamp()-updated_at)) ELSE 0 END) AS elapsed,clock_timestamp() AS "updatedAt" FROM skill_practices WHERE account_id=${accountId}::uuid AND status IN ('running','paused') LIMIT 1`,
  ]);
  return {
    balance: Number(accounts[0]?.heart_balance ?? 0),
    unlocked: unlocked.map((r) => r.method) as SkillProgress["unlocked"],
    practiced: rewards
      .filter((r) => r.reason === "practice")
      .map((r) => r.reference) as SkillProgress["practiced"],
    installClaimed: rewards.some((r) => r.reason === "install"),
    shortcutClaimed: rewards.some((r) => r.reason === "shortcut"),
    entries: entries as SkillProgress["entries"],
    practice: (practices[0] ?? null) as SkillProgress["practice"],
  };
}
