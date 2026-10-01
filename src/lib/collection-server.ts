import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { database } from "./db";
import { siteUrl } from "./site";
export { sameOrigin } from "./site";
import { EMPTY_COLLECTION, type CollectionData } from "./collection-contract";

export const AUTH_COOKIE = "study-collection";
export const OAUTH_COOKIE = "study-oauth";
export const INVITE_COOKIE = "study-invite";
export const token = () => randomBytes(32).toString("base64url");
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
export function loginConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.KAKAO_REST_API_KEY &&
    process.env.KAKAO_CLIENT_SECRET,
  );
}
export function callbackUrl() {
  return `${siteUrl()}/api/auth/kakao/callback`;
}
export type CollectionAccount = {
  id: string;
  kakao_id: string;
  invite_code: string;
  first_type: string | null;
  first_run_id: string | null;
};
export async function account() {
  const value = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!value) return null;
  if (!process.env.DATABASE_URL) throw new Error("unavailable");
  const sql = database();
  const rows = await sql`SELECT a.* FROM collection_accounts a
    JOIN collection_sessions s ON s.account_id=a.id
    WHERE s.token_hash=${hash(value)} AND s.expires_at>now()`;
  return (rows[0] as CollectionAccount | undefined) ?? null;
}
export async function collectionData(
  owner: CollectionAccount | null,
): Promise<CollectionData> {
  if (!owner) return { ...EMPTY_COLLECTION, configured: loginConfigured() };
  const sql = database();
  const [cards, counts] = await Promise.all([
    sql`SELECT type_code,source,reward_id,opened_at FROM collection_cards WHERE account_id=${owner.id}::uuid ORDER BY created_at,reward_id`,
    sql`SELECT count(*)::int AS total FROM collection_referrals WHERE inviter_id=${owner.id}::uuid`,
  ]);
  return {
    configured: loginConfigured(),
    signedIn: true,
    firstType: owner.first_type,
    firstRunId: owner.first_run_id,
    inviteCode: owner.first_type ? owner.invite_code : null,
    cards: cards
      .filter((c) => c.opened_at)
      .map((c) => ({
        code: String(c.type_code),
        source: c.source as "first" | "referral",
      })),
    pending: cards
      .filter((c) => !c.opened_at)
      .map((c) => ({ id: String(c.reward_id) })),
    referralCount: Number(counts[0].total),
  };
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Cookie" },
  });
}
export async function body(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("content_type");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("payload");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new Error("size");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function limited(key: string, limit = 30) {
  const sql = database();
  const rows = await sql`INSERT INTO collection_limits(key,hits,expires_at)
    VALUES(${key},1,now()+interval '10 minutes')
    ON CONFLICT(key) DO UPDATE SET
      hits=CASE WHEN collection_limits.expires_at<now() THEN 1 ELSE collection_limits.hits+1 END,
      expires_at=CASE WHEN collection_limits.expires_at<now() THEN now()+interval '10 minutes' ELSE collection_limits.expires_at END
    RETURNING hits`;
  return Number(rows[0].hits) > limit;
}
export async function capturedInvite() {
  const value = (await cookies()).get(INVITE_COOKIE)?.value;
  if (!value || !process.env.DATABASE_URL) return null;
  const sql = database();
  const rows = await sql`SELECT a.invite_code FROM collection_invites i
    JOIN collection_accounts a ON a.id=i.inviter_id
    WHERE i.token_hash=${hash(value)} AND i.expires_at>now() AND a.first_type IS NOT NULL`;
  return rows[0] ? String(rows[0].invite_code) : null;
}
