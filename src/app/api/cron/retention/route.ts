import { timingSafeEqual } from "node:crypto";
import { database } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  if (
    !secret ||
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  )
    return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL)
    return Response.json({ error: "not_configured" }, { status: 503 });
  try {
    const sql = database();
    await sql`SELECT study_rollup()`;
    await sql.transaction([
      sql`DELETE FROM collection_sessions WHERE expires_at<now()`,
      sql`DELETE FROM collection_oauth_states WHERE expires_at<now()`,
      sql`DELETE FROM collection_invites WHERE expires_at<now()`,
      sql`DELETE FROM collection_limits WHERE expires_at<now()`,
    ]);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
