import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { account, collectionData, json } from "@/lib/collection-server";
import { specialCardProgress } from "@/lib/special-card";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const collection = await collectionData(owner);
    if (!specialCardProgress(collection).unlocked)
      return json({ error: "collection_incomplete" }, 403);

    const download = new URL(request.url).searchParams.get("download") === "1";
    const extension = download ? "png" : "webp";
    const photograph = await readFile(
      join(process.cwd(), `art/characters/special/group-photo.${extension}`),
    );
    return new Response(new Uint8Array(photograph), {
      headers: {
        "Content-Type": `image/${extension}`,
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="gongbucae-special-16.${extension}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
