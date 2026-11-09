import { z } from "zod";
import { account, body, json, sameOrigin } from "@/lib/collection-server";
import { database } from "@/lib/db";
import { SDJ_EVENT } from "@/lib/sdj-event";

export const runtime = "nodejs";
export async function GET() {
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const rows =
      await database()`SELECT enrolled_at FROM school_event_participants
      WHERE event_id=${SDJ_EVENT.id} AND account_id=${owner.id}::uuid`;
    return json({
      enrolled: Boolean(rows[0]),
      enrolledAt: rows[0] ? new Date(rows[0].enrolled_at).toISOString() : null,
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (!SDJ_EVENT.registrationOpen) return json({ error: "closed" }, 409);
  let payload;
  try {
    payload = z
      .object({
        source: z.enum(["poster_qr", "event_page"]),
      })
      .strict()
      .parse(await body(request));
  } catch {
    return json({ error: "payload" }, 400);
  }
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    // A repeated request preserves the original source and registration time.
    const rows =
      await database()`INSERT INTO school_event_participants(event_id,account_id,source)
      VALUES(${SDJ_EVENT.id},${owner.id}::uuid,${payload.source})
      ON CONFLICT(event_id,account_id) DO UPDATE
        SET account_id=EXCLUDED.account_id
      RETURNING enrolled_at`;
    return json({
      enrolled: true,
      enrolledAt: new Date(rows[0].enrolled_at).toISOString(),
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
