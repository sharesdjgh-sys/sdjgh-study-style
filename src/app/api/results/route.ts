import {
  account,
  body,
  json,
  limited,
  sameOrigin,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
import { parseSession } from "@/lib/storage";
import { saveAccountResult } from "@/lib/saved-results-server";

export const runtime = "nodejs";
export async function GET() {
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const rows = await database()`SELECT session FROM saved_study_results
      WHERE account_id=${owner.id}::uuid AND (run_id IN (
        SELECT run_id FROM saved_study_results WHERE account_id=${owner.id}::uuid
        ORDER BY completed_at DESC LIMIT 100
      ) OR run_id=(SELECT first_run_id FROM collection_accounts WHERE id=${owner.id}::uuid))
      ORDER BY completed_at DESC`;
    return json({ results: rows.map((row) => row.session) });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    let session;
    try {
      session = parseSession(JSON.stringify(await body(request)));
    } catch {
      return json({ error: "payload" }, 400);
    }
    if (!session?.result || !session.completedAt)
      return json({ error: "completed_result_required" }, 400);
    if (await limited(`results:${owner.id}`, 40))
      return json({ error: "rate_limit" }, 429);
    if (!(await saveAccountResult(owner.id, session)))
      return json({ error: "run_conflict" }, 409);
    return json({ ok: true });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
