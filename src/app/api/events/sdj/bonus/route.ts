import { account, json, sameOrigin } from "@/lib/collection-server";
import { database } from "@/lib/db";
import { SDJ_EVENT } from "@/lib/sdj-event";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (!SDJ_EVENT.registrationOpen) return json({ error: "closed" }, 409);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const [result] =
      await database()`SELECT claim_sdj_qr_reward(${owner.id}::uuid) AS status`;
    return json({ status: result.status });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
