import { cookies } from "next/headers";
import { z } from "zod";
import {
  account,
  body,
  capturedInvite,
  cookieOptions,
  hash,
  INVITE_COOKIE,
  json,
  sameOrigin,
  token,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  try {
    return json({ code: await capturedInvite() });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  let code;
  try {
    code = z
      .object({ code: z.string().regex(/^[A-F0-9]{10}$/) })
      .parse(await body(request)).code;
  } catch {
    return json({ error: "invalid_invite" }, 400);
  }
  if (!process.env.DATABASE_URL) return json({ error: "unavailable" }, 503);
  try {
    const existing = await capturedInvite();
    if (existing) return json({ code: existing });
    const owner = await account();
    if (owner?.first_type)
      return json({ code: null, reason: "already_registered" });
    const sql = database();
    const rows =
      await sql`SELECT id FROM collection_accounts WHERE invite_code=${code} AND first_type IS NOT NULL`;
    if (!rows[0]) return json({ error: "invalid_invite" }, 404);
    if (rows[0].id === owner?.id) return json({ error: "self_invite" }, 409);
    const value = token();
    await sql`INSERT INTO collection_invites(token_hash,inviter_id,expires_at) VALUES(${hash(value)},${rows[0].id}::uuid,now()+interval '7 days')`;
    (await cookies()).set(INVITE_COOKIE, value, cookieOptions(7 * 86400));
    return json({ code });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
