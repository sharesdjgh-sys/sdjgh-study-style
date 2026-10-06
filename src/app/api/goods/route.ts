import { z } from "zod";
import {
  account,
  body,
  json,
  limited,
  sameOrigin,
} from "@/lib/collection-server";
import { database } from "@/lib/db";
import { EMPTY_GOODS, getGoods } from "@/lib/goods";
import { goodsProgress } from "@/lib/goods-server";
export const runtime = "nodejs";
export async function GET() {
  try {
    const owner = await account();
    return json({
      accountId: owner?.id ?? null,
      progress: owner ? await goodsProgress(owner.id) : EMPTY_GOODS,
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
const schema = z.object({ id: z.string().refine((id) => !!getGoods(id)) });
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
    if (await limited(`goods:${owner.id}`, 60))
      return json({ error: "rate_limit" }, 429);
    const rows =
      await database()`SELECT redeem_goods(${owner.id}::uuid,${input.id}) AS outcome`;
    const outcome = String(rows[0].outcome);
    if (!["redeemed", "already_owned"].includes(outcome))
      return json({ error: outcome }, 409);
    return json({
      accountId: owner.id,
      progress: await goodsProgress(owner.id),
      outcome,
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
