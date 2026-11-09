import { cookies } from "next/headers";
import { AUTH_COOKIE, hash, json, sameOrigin } from "@/lib/collection-server";
import { database } from "@/lib/db";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return json({ show: false }, 401);
  try {
    const sql = database();
    // Consume the first-login invitation atomically, even across tabs/devices.
    // A subsequent login clears the invitation in establish_collection_session.
    const rows =
      await sql`UPDATE collection_accounts a SET install_prompt_token_hash=NULL
      FROM collection_sessions s
      WHERE s.account_id=a.id AND s.token_hash=${hash(token)} AND s.expires_at>now()
      AND a.install_prompt_token_hash=s.token_hash AND a.first_type IS NOT NULL
      RETURNING a.id`;
    return json({ show: rows.length === 1 });
  } catch {
    // Fail closed: a transient error must never prompt a returning student.
    return json({ show: false }, 503);
  }
}
