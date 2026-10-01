import { cookies } from "next/headers";
import {
  account,
  AUTH_COOKIE,
  cookieOptions,
  INVITE_COOKIE,
  json,
  sameOrigin,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const sql = database();
    await sql`DELETE FROM collection_accounts WHERE id=${owner.id}::uuid`;
    const jar = await cookies();
    jar.set(AUTH_COOKIE, "", cookieOptions(0));
    jar.set(INVITE_COOKIE, "", cookieOptions(0));
    return json({ ok: true });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
