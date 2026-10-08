import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { account, json } from "@/lib/collection-server";
import { database } from "@/lib/db";
import { getGoods } from "@/lib/goods";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const card = getGoods(params.get("id") ?? "");
  if (!card || card.kind !== "motion") return json({ error: "payload" }, 400);
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const owned =
      await database()`SELECT 1 FROM goods_unlocks WHERE account_id=${owner.id}::uuid AND goods_id=${card.id}`;
    if (!owned.length) return json({ error: "goods_required" }, 403);
    const data = await readFile(
      join(process.cwd(), "art/goods-motion", `${card.id}.mp4`),
    );
    const size = data.byteLength;
    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${params.get("download") === "1" ? "attachment" : "inline"}; filename="StudyCrew-${card.id}.mp4"`,
    });
    let start = 0,
      end = size - 1,
      status = 200;
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match?.[1]) {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), end);
      } else if (match?.[2]) start = Math.max(0, size - Number(match[2]));
      if (
        !match ||
        (!match[1] && !match[2]) ||
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= size
      ) {
        headers.set("Content-Range", `bytes */${size}`);
        return new Response(null, { status: 416, headers });
      }
      status = 206;
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    }
    headers.set("Content-Length", String(end - start + 1));
    return new Response(
      request.method === "HEAD"
        ? null
        : new Uint8Array(data.subarray(start, end + 1)),
      { status, headers },
    );
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
export const HEAD = GET;
