import { z } from "zod";
import { account, body, json, sameOrigin } from "@/lib/collection-server";
import { database } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  let id;
  try {
    id = z.object({ id: z.uuid() }).parse(await body(request)).id;
  } catch {
    return json({ error: "payload" }, 400);
  }
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const sql = database();
    const rows =
      await sql`UPDATE collection_cards SET opened_at=COALESCE(opened_at,now())
      WHERE account_id=${owner.id}::uuid AND reward_id=${id}::uuid AND source='referral' RETURNING type_code`;
    if (!rows[0]) return json({ error: "not_found" }, 404);
    return json({ code: rows[0].type_code });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
