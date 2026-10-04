import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  callbackUrl,
  cookieOptions,
  hash,
  json,
  loginConfigured,
  OAUTH_COOKIE,
  sameOrigin,
  token,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { timedAuth } from "@/lib/auth-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (!loginConfigured())
    return wantsJson
      ? json({ error: "unavailable" }, 503)
      : NextResponse.redirect(
          new URL("/collection?auth=unavailable", siteUrl()),
          303,
        );
  try {
    const state = token();
    const browser = token();
    const sql = database();
    await timedAuth(
      "start_db",
      async () => sql`INSERT INTO collection_oauth_states(state_hash,browser_hash,expires_at)
      VALUES(${hash(state)},${hash(browser)},now()+interval '10 minutes')`,
    );
    (await cookies()).set(OAUTH_COOKIE, browser, cookieOptions(600));
    const url = new URL("https://kauth.kakao.com/oauth/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: process.env.KAKAO_REST_API_KEY!,
      redirect_uri: callbackUrl(),
      state,
    }).toString();
    return wantsJson
      ? json({ authorizationUrl: url.toString() })
      : NextResponse.redirect(url, 303);
  } catch {
    return wantsJson
      ? json({ error: "unavailable" }, 503)
      : NextResponse.redirect(
          new URL("/collection?auth=unavailable", siteUrl()),
          303,
        );
  }
}
