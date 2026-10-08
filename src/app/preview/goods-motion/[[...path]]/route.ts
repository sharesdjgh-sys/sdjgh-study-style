import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
const base = "/preview/goods-motion";
const directories: Record<string, string> = {
  v1: "goods-motion-pilot-v1",
  v2: "goods-motion-pilot-v2",
  lumi15: "goods-motion-lumi-15s",
  gaze15: "goods-motion-lumi-15s-gaze-v2",
  series: "goods-motion-series",
  revision5: "goods-motion-revision-five",
  active5: "goods-motion-active-five",
  toriresult: "goods-motion-tori-result",
};
const mime: Record<string, string> = {
  html: "text/html; charset=utf-8",
  mp4: "video/mp4",
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
};
type Context = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, context: Context) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }
  const { path = [] } = await context.params;
  if (!path.length) {
    return Response.redirect(new URL(`${base}/series/index.html`, request.url));
  }
  const [version, ...parts] = path;
  const directory = directories[version];
  const file = parts.join("/");
  if (
    !directory ||
    !/^(?:index\.html|(?:videos|posters|review)\/(?:lumi|moa|root|pico|sori|melo|talk|leaf|tori|mong|block|joy|pace|bani|luka|skip)(?:-(?:start|end|contact|loop))?\.(?:mp4|webp|jpg|png))$/.test(file)
  ) {
    return new Response(null, { status: 404 });
  }
  let data: Uint8Array;
  try {
    const buffer = await readFile(join(process.cwd(), "ref", directory, file));
    data = file === "index.html"
      ? new TextEncoder().encode(
          buffer.toString("utf8")
            .replace(/(['"])\/(v1|v2|lumi15|gaze15|series|revision5|active5|toriresult)\//g, `$1${base}/$2/`)
            .replaceAll("'/'+version.value", `'${base}/'+version.value`),
        )
      : new Uint8Array(buffer);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return new Response("Preview asset not found", { status: 404 });
  }
  const headers = new Headers({
    "Content-Type": mime[file.split(".").at(-1)!],
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  });
  let status = 200;
  const size = data.byteLength;
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    let start = 0;
    let end = size - 1;
    if (match?.[1]) {
      start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), end);
    } else if (match?.[2]) {
      start = Math.max(0, size - Number(match[2]));
    }
    if (!match || (!match[1] && !match[2]) || start > end || start >= size) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    data = data.slice(start, end + 1);
  }
  headers.set("Content-Length", String(data.byteLength));
  return new Response(request.method === "HEAD" ? null : new Uint8Array(data), { status, headers });
}

export const HEAD = GET;
