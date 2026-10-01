import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  cookieOptions,
  hash,
  json,
  sameOrigin,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  try {
    const jar = await cookies();
    const value = jar.get(AUTH_COOKIE)?.value;
    if (value && process.env.DATABASE_URL) {
      const sql = database();
      await sql`DELETE FROM collection_sessions WHERE token_hash=${hash(value)}`;
    }
    jar.set(AUTH_COOKIE, "", cookieOptions(0));
    return json({ ok: true });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
