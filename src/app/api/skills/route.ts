import { z } from "zod";
import {
  account,
  body,
  json,
  limited,
  sameOrigin,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
import { isMethodId } from "@/lib/methods";
import { EMPTY_SKILLS } from "@/lib/skill-economy";
import { skillProgress } from "@/lib/skill-server";
export const runtime = "nodejs";
const method = z.string().refine(isMethodId);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("unlock"), method }),
  z.object({
    action: z.literal("install"),
    standalone: z.literal(true),
    mobile: z.literal(true),
  }),
  z.object({ action: z.literal("start"), method }),
  z.object({ action: z.enum(["pause", "resume", "cancel"]), id: z.uuid() }),
  z.object({
    action: z.literal("complete"),
    id: z.uuid(),
    answers: z.array(z.number().int().min(0).max(3)).length(3),
  }),
]);
export async function GET() {
  try {
    const owner = await account();
    return json({
      accountId: owner?.id ?? null,
      progress: owner ? await skillProgress(owner.id) : EMPTY_SKILLS,
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  let input;
  try {
    input = schema.parse(await body(request));
  } catch {
    return json({ error: "payload" }, 400);
  }
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    if (await limited(`skills:${owner.id}`, 90))
      return json({ error: "rate_limit" }, 429);
    const sql = database();
    let awarded = 0;
    let outcome = "ok";
    if (input.action === "unlock") {
      const rows =
        await sql`SELECT unlock_skill(${owner.id}::uuid,${input.method}) AS outcome`;
      outcome = String(rows[0].outcome);
      if (!["unlocked", "already_open"].includes(outcome))
        return json({ error: outcome }, 409);
    } else if (input.action === "install") {
      // Display mode is a browser claim, not cryptographic installation proof.
      const rows =
        await sql`SELECT credit_hearts(${owner.id}::uuid,'install','mobile-pwa',3) AS awarded`;
      awarded = Number(rows[0].awarded);
    } else {
      const methodId = "method" in input ? input.method : null;
      const id = "id" in input ? input.id : null;
      const answers = "answers" in input ? JSON.stringify(input.answers) : null;
      const rows =
        await sql`SELECT practice_action(${owner.id}::uuid,${input.action},${methodId},${id}::uuid,${answers}::jsonb) AS result`;
      const result = rows[0].result;
      if (result.error) return json({ error: result.error }, 409);
      awarded = Number(result.awarded);
    }
    return json({
      accountId: owner.id,
      progress: await skillProgress(owner.id),
      awarded,
      outcome,
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
