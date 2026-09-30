import { eventSchema } from "@/lib/event-schema";
import { database } from "@/lib/db";
export const runtime = "nodejs";
// 짧은 요청 횟수만 메모리에 보관하며 IP와 답변은 기록하지 않습니다.
const windows = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "content_type" }, { status: 415 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024)
    return Response.json({ error: "size" }, { status: 413 });
  let body: string;
  try {
    body = await request.text();
    if (body.length > 1024)
      return Response.json({ error: "size" }, { status: 413 });
  } catch {
    return Response.json({ error: "body" }, { status: 400 });
  }
  let parsed;
  try {
    parsed = eventSchema.safeParse(JSON.parse(body));
  } catch {
    return Response.json({ error: "payload" }, { status: 400 });
  }
  if (!parsed.success)
    return Response.json({ error: "payload" }, { status: 400 });
  if (!process.env.DATABASE_URL) return new Response(null, { status: 204 });
  const e = parsed.data;
  const now = Date.now();
  for (const [key, value] of windows)
    if (value.until < now) windows.delete(key);
  const limit = windows.get(e.runId) ?? { count: 0, until: now + 60_000 };
  if (limit.count >= 60 || windows.size > 2000)
    return Response.json(
      { error: "rate_limit" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  limit.count++;
  windows.set(e.runId, limit);
  try {
    const sql = database();
    if (e.name === "start") {
      await sql.transaction([
        sql`INSERT INTO study_sessions (run_id, version, source) VALUES (${e.runId}::uuid,${e.version},${e.source}) ON CONFLICT (run_id) DO NOTHING`,
        sql`INSERT INTO study_events (run_id,name,slot,detail) SELECT run_id,'start','','' FROM study_sessions WHERE run_id=${e.runId}::uuid AND expires_at>now() ON CONFLICT (run_id,name,slot) DO NOTHING`,
      ]);
    } else {
      const slot = e.name === "question" || e.name === "share" ? e.detail : "";
      await sql`INSERT INTO study_events (run_id,name,slot,detail)
        SELECT run_id,${e.name},${slot},${e.detail} FROM study_sessions s
        WHERE run_id=${e.runId}::uuid AND expires_at>now()
          AND (${e.name} IN ('question','complete') OR EXISTS (SELECT 1 FROM study_events c WHERE c.run_id=s.run_id AND c.name='complete'))
        ON CONFLICT (run_id,name,slot) DO UPDATE SET detail=EXCLUDED.detail WHERE study_events.name='feedback'`;
    }
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
