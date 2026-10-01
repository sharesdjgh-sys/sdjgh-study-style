import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  callbackUrl,
  cookieOptions,
  hash,
  loginConfigured,
  OAUTH_COOKIE,
  token,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
import { siteUrl } from "@/lib/site";
export const runtime = "nodejs";
const finish = (status: string) =>
  NextResponse.redirect(new URL(`/collection?auth=${status}`, siteUrl()), 303);
export async function GET(request: Request) {
  if (!loginConfigured()) return finish("unavailable");
  const params = new URL(request.url).searchParams;
  const jar = await cookies();
  const browser = jar.get(OAUTH_COOKIE)?.value;
  const state = params.get("state");
  if (!browser || !state || state.length > 100) return finish("expired");
  try {
    const sql = database();
    const rows =
      await sql`DELETE FROM collection_oauth_states WHERE state_hash=${hash(state)}
      AND browser_hash=${hash(browser)} AND expires_at>now() RETURNING state_hash`;
    jar.set(OAUTH_COOKIE, "", cookieOptions(0));
    if (!rows.length) return finish("expired");
    if (params.has("error")) return finish("cancelled");
    const code = params.get("code");
    if (!code || code.length > 2048) return finish("failed");
    const exchange = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: callbackUrl(),
        code,
      }),
    });
    if (!exchange.ok) return finish("failed");
    const tokens = await exchange.json();
    if (typeof tokens.access_token !== "string") return finish("failed");
    const identity = await fetch(
      "https://kapi.kakao.com/v2/user/me?property_keys=%5B%5D",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    if (!identity.ok) return finish("failed");
    const profile = await identity.json();
    if (!Number.isSafeInteger(profile.id) || profile.id <= 0)
      return finish("failed");
    // Provider tokens and profile data are discarded; only the app-scoped ID persists.
    const accounts =
      await sql`INSERT INTO collection_accounts(kakao_id,invite_code)
      VALUES(${String(profile.id)},${randomBytes(5).toString("hex").toUpperCase()})
      ON CONFLICT(kakao_id) DO UPDATE SET kakao_id=EXCLUDED.kakao_id RETURNING id`;
    const value = token();
    const previous = jar.get(AUTH_COOKIE)?.value;
    await sql.transaction([
      sql`DELETE FROM collection_sessions WHERE token_hash=${hash(previous ?? "")} OR expires_at<now()`,
      sql`INSERT INTO collection_sessions(token_hash,account_id,expires_at)
        VALUES(${hash(value)},${accounts[0].id}::uuid,now()+interval '30 days')`,
    ]);
    jar.set(AUTH_COOKIE, value, cookieOptions(30 * 86400));
    return finish("success");
  } catch {
    return finish("failed");
  }
}
