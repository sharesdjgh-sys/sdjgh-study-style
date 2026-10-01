import { z } from "zod";
import { cookies } from "next/headers";
import {
  account,
  body,
  capturedInvite,
  INVITE_COOKIE,
  cookieOptions,
  json,
  limited,
  sameOrigin,
} from "@/lib/collection-server";
import { parseSession } from "@/lib/storage";
import { database } from "@/lib/db";
const schema = z.object({
  session: z.unknown(),
  inviteCode: z
    .string()
    .regex(/^[A-F0-9]{10}$/)
    .optional(),
});
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  let data;
  try {
    data = schema.parse(await body(request));
  } catch {
    return json({ error: "payload" }, 400);
  }
  // Validation re-scores every answer; raw answers are never persisted or logged.
  const session = parseSession(JSON.stringify(data.session));
  if (!session?.result || session.isRetake)
    return json({ error: "first_result_required" }, 400);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    if (await limited(`register:${owner.id}`))
      return json({ error: "rate_limit" }, 429);
    const invite = (await capturedInvite()) ?? data.inviteCode ?? null;
    const sql = database();
    const rows =
      await sql`SELECT register_collection(${owner.id}::uuid,${session.runId}::uuid,${session.result},${invite}) AS outcome`;
    const outcome = String(rows[0].outcome);
    if (["run_claimed", "self_invite", "invalid_invite"].includes(outcome))
      return json({ error: outcome }, 409);
    (await cookies()).set(INVITE_COOKIE, "", cookieOptions(0));
    return json({ outcome });
  } catch (error) {
    // A racing claim of the same run by a different account hits the UNIQUE key.
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return json({ error: "run_claimed" }, 409);
    return json({ error: "unavailable" }, 503);
  }
}
