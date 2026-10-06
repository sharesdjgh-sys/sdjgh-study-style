import { account, json, limited } from "@/lib/collection-server";
import { database } from "@/lib/db";
import { getGoods } from "@/lib/goods";
import { renderGoods } from "@/lib/goods-render";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const card = getGoods(params.get("id") ?? "");
  const side = params.get("side") ?? "front";
  if (!card || !["front", "back"].includes(side))
    return json({ error: "payload" }, 400);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const owned =
      await database()`SELECT 1 FROM goods_unlocks WHERE account_id=${owner.id}::uuid AND goods_id=${card.id}`;
    if (!owned.length) return json({ error: "goods_required" }, 403);
    if (await limited(`goods-image:${owner.id}`, 120))
      return json({ error: "rate_limit" }, 429);
    const jpeg = await renderGoods(card, side === "back");
    const filename = `StudyCrew-${card.name}-${card.title}-${side === "back" ? "뒷면" : "앞면"}.jpg`;
    return new Response(jpeg, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.byteLength),
        "Content-Disposition": `${params.get("download") === "1" ? "attachment" : "inline"}; filename="${card.id}-${side}.jpg"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
