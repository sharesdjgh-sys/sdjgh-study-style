import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { account, collectionData, json } from "@/lib/collection-server";
import { specialCardProgress } from "@/lib/special-card";
import { MODALITIES } from "@/lib/content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const family = params.get("family");
    const modality = MODALITIES.find((value) => value === family);
    if (family !== null && !modality)
      return json({ error: "invalid_family" }, 400);
    const format = params.get("format");
    if (format !== null && (format !== "mp4" || !modality))
      return json({ error: "invalid_format" }, 400);
    const owner = await account();
    if (!owner) return json({ error: "unauthorized" }, 401);
    const collection = await collectionData(owner);
    if (!specialCardProgress(collection, modality).unlocked)
      return json({ error: "collection_incomplete" }, 403);

    const download = params.get("download") === "1";
    const extension = format === "mp4" ? "mp4" : download ? "png" : "webp";
    const photograph = await readFile(
      join(
        process.cwd(),
        `art/characters/special/${modality ? `families/${modality}${format === "mp4" ? "-loop-8s-v1" : ""}` : "group-photo"}.${extension}`,
      ),
    );
    const headers: Record<string, string> = {
      "Content-Type": extension === "mp4" ? "video/mp4" : `image/${extension}`,
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="gongbucae-${modality ?? "special-16"}.${extension}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Length": String(photograph.length),
    };
    if (extension === "mp4") {
      headers["Accept-Ranges"] = "bytes";
      const range = request.headers.get("range");
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        const start = match?.[1]
          ? Number(match[1])
          : Math.max(0, photograph.length - Number(match?.[2]));
        const end =
          match?.[1] && match[2]
            ? Math.min(Number(match[2]), photograph.length - 1)
            : photograph.length - 1;
        if (
          !match ||
          (!match[1] && !match[2]) ||
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start > end ||
          start >= photograph.length
        ) {
          return new Response(null, {
            status: 416,
            headers: {
              ...headers,
              "Content-Length": "0",
              "Content-Range": `bytes */${photograph.length}`,
            },
          });
        }
        return new Response(
          new Uint8Array(photograph.subarray(start, end + 1)),
          {
            status: 206,
            headers: {
              ...headers,
              "Content-Length": String(end - start + 1),
              "Content-Range": `bytes ${start}-${end}/${photograph.length}`,
            },
          },
        );
      }
    }
    return new Response(new Uint8Array(photograph), { headers });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
