import { z } from "zod";
import { cookies } from "next/headers";
import {
  account,
  body,
  capturedInvite,
  INVITE_COOKIE,
  cookieOptions,
  json,
  latestBonus,
  limited,
  sameOrigin,
} from "@/lib/collection-server";
import { parseSession } from "@/lib/storage";
import { database } from "@/lib/db";
import { saveAccountResult } from "@/lib/saved-results-server";
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
  // Validation re-scores every answer before storing the account snapshot.
  const raw = JSON.stringify(data.session);
  const session = parseSession(raw, Date.now(), true);
  if (!session?.result || session.isRetake)
    return json({ error: "first_result_required" }, 400);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    // Old records may register only if this account already owns the snapshot.
    if (!parseSession(raw)) {
      const saved = await database()`SELECT run_id FROM saved_study_results
        WHERE run_id=${session.runId}::uuid AND account_id=${owner.id}::uuid`;
      if (!saved.length) return json({ error: "first_result_required" }, 400);
    }
    if (await limited(`register:${owner.id}`))
      return json({ error: "rate_limit" }, 429);
    const invite = (await capturedInvite()) ?? data.inviteCode ?? null;
    // Claim the immutable snapshot before issuing a first-character reward.
    if (!(await saveAccountResult(owner.id, session)))
      return json({ error: "run_claimed" }, 409);
    const sql = database();
    const rows =
      await sql`SELECT register_collection(${owner.id}::uuid,${session.runId}::uuid,${session.result},${invite}) AS outcome`;
    const outcome = String(rows[0].outcome);
    if (["run_claimed", "self_invite", "invalid_invite"].includes(outcome))
      return json({ error: outcome }, 409);
    (await cookies()).set(INVITE_COOKIE, "", cookieOptions(0));
    const hearts =
      outcome === "already_registered"
        ? []
        : await sql`SELECT type_code AS code,heart_reward AS amount FROM collection_cards WHERE account_id=${owner.id}::uuid AND opened_at IS NOT NULL AND heart_reward>0`;
    return json(
      outcome === "referred"
        ? { outcome, bonus: await latestBonus(owner.id), hearts }
        : { outcome, hearts },
    );
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
