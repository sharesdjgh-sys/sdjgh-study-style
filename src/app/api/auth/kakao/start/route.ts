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
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (!loginConfigured())
    return NextResponse.redirect(
      new URL("/collection?auth=unavailable", siteUrl()),
      303,
    );
  try {
    const state = token();
    const browser = token();
    const sql = database();
    await sql`DELETE FROM collection_oauth_states WHERE expires_at<now()`;
    await sql`INSERT INTO collection_oauth_states(state_hash,browser_hash,expires_at)
      VALUES(${hash(state)},${hash(browser)},now()+interval '10 minutes')`;
    (await cookies()).set(OAUTH_COOKIE, browser, cookieOptions(600));
    const url = new URL("https://kauth.kakao.com/oauth/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: process.env.KAKAO_REST_API_KEY!,
      redirect_uri: callbackUrl(),
      state,
    }).toString();
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(
      new URL("/collection?auth=unavailable", siteUrl()),
      303,
    );
  }
}
