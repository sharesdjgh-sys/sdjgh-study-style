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
import { identityHash, timedAuth } from "@/lib/auth-server";
import { MANAGER_COOKIE, managerProof, verifiedSdjManager } from "@/lib/sdj-manager";
import { authReturnPath } from "@/lib/auth-contract";
export const runtime = "nodejs";
const finish = (
  status: string,
  retryAt?: string,
  returnPath = "/collection",
) => {
  const url = new URL(returnPath, siteUrl());
  url.searchParams.set("auth", status);
  if (retryAt) url.searchParams.set("retryAt", retryAt);
  return NextResponse.redirect(url, 303);
};
export async function GET(request: Request) {
  let returnPath = "/collection";
  const complete = (status: string, retryAt?: string) =>
    finish(status, retryAt, returnPath);
  if (!loginConfigured()) return complete("unavailable");
  const params = new URL(request.url).searchParams;
  const jar = await cookies();
  const browser = jar.get(OAUTH_COOKIE)?.value;
  const state = params.get("state");
  if (!browser || !state || state.length > 100) return complete("expired");
  try {
    const sql = database();
    const rows =
      await sql`DELETE FROM collection_oauth_states WHERE state_hash=${hash(state)}
      AND browser_hash=${hash(browser)} AND expires_at>now() RETURNING state_hash,return_path`;
    jar.set(OAUTH_COOKIE, "", cookieOptions(0));
    if (!rows.length) return complete("expired");
    returnPath = authReturnPath(String(rows[0].return_path ?? ""));
    if (params.has("error")) return complete("cancelled");
    const code = params.get("code");
    if (!code || code.length > 2048) return complete("failed");
    const exchange = await timedAuth("kakao_token", () =>
      fetch("https://kauth.kakao.com/oauth/token", {
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
      }),
    );
    if (!exchange.ok) return complete("failed");
    const tokens = await exchange.json();
    if (typeof tokens.access_token !== "string") return complete("failed");
    const loadIdentity = (keys: string[]) =>
      fetch("https://kapi.kakao.com/v2/user/me?" + new URLSearchParams({ property_keys: JSON.stringify(keys) }), {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
    const identity = await timedAuth("kakao_identity", async () => {
      const response = await loadIdentity(["kakao_account.email"]);
      return response.status === 400 || response.status === 403 ? loadIdentity([]) : response;
    });
    if (!identity.ok) return complete("failed");
    const profile = await identity.json();
    if (!Number.isSafeInteger(profile.id) || profile.id <= 0)
      return complete("failed");
    // Provider tokens and profile data are discarded; only the app-scoped ID persists.
    const value = token();
    const previous = jar.get(AUTH_COOKIE)?.value;
    const accounts = await timedAuth(
      "callback_db",
      async () => sql`SELECT * FROM establish_collection_session(
      ${String(profile.id)},${identityHash(String(profile.id))},
      ${randomBytes(5).toString("hex").toUpperCase()},${hash(value)},${hash(previous ?? "")})`,
    );
    if (accounts[0]?.rejoin_after) {
      jar.set(AUTH_COOKIE, "", cookieOptions(0));
      return complete(
        "rejoin_blocked",
        new Date(accounts[0].rejoin_after).toISOString(),
      );
    }
    if (!accounts[0]?.account_id) return complete("failed");
    const manager = verifiedSdjManager(profile.kakao_account);
    jar.set(MANAGER_COOKIE, manager ? managerProof(value) : "", cookieOptions(manager ? 30 * 86400 : 0));
    jar.set(AUTH_COOKIE, value, cookieOptions(30 * 86400));
    return complete("success");
  } catch {
    return complete("failed");
  }
}
