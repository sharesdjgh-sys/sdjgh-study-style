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
import { identityHash } from "@/lib/auth-server";
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const sql = database();
    const rows =
      await sql`SELECT withdraw_collection_account(${owner.id}::uuid,${identityHash(owner.kakao_id)}) AS rejoin_after`;
    if (!rows[0]?.rejoin_after) return json({ error: "unauthorized" }, 401);
    const jar = await cookies();
    jar.set(AUTH_COOKIE, "", cookieOptions(0));
    jar.set(INVITE_COOKIE, "", cookieOptions(0));
    return json({
      ok: true,
      rejoinAfter: new Date(rows[0].rejoin_after).toISOString(),
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
