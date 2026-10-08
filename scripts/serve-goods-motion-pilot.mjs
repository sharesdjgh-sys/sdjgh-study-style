import http from "node:http";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";

const version = process.argv.includes("--loop-v2") ? "v2" : "v1";
const types = {
  html: "text/html; charset=utf-8",
  json: "application/json; charset=utf-8",
  mp4: "video/mp4",
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  txt: "text/plain; charset=utf-8",
};
http
  .createServer(async (req, res) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      let path =
        decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname).slice(
          1,
        ) || "index.html";
      const prefix = /^(v1|v2|lumi15)\//.exec(path)?.[1];
      if (prefix) path = path.slice(prefix.length + 1) || "index.html";
      const directory = prefix === "lumi15" ? "goods-motion-lumi-15s" : `goods-motion-pilot-${prefix || version}`;
      const root = new URL(`../ref/${directory}/`, import.meta.url);
      if (
        !/^(?:index\.html|manifest\.json|(?:videos|posters|review|frames|prompts)\/(?:lumi|melo|block)(?:-(?:start|end|contact|loop))?\.(?:mp4|webp|jpg|png|txt))$/.test(
          path,
        )
      ) {
        res.writeHead(404);
        res.end();
        return;
      }
      const file = new URL(path, root);
      const info = await stat(file);
      const headers = {
        "Content-Type": types[path.split(".").at(-1)],
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      };
      let start = 0,
        end = info.size - 1,
        code = 200;
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!range || (!range[1] && !range[2])) {
          res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
          res.end();
          return;
        }
        if (range[1]) {
          start = Number(range[1]);
          end = range[2] ? Math.min(Number(range[2]), end) : end;
        } else start = Math.max(0, info.size - Number(range[2]));
        if (start > end || start >= info.size) {
          res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
          res.end();
          return;
        }
        code = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
      }
      res.writeHead(code, { ...headers, "Content-Length": end - start + 1 });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      const stream = createReadStream(file, { start, end });
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(3102, "127.0.0.1", () =>
    console.log("Motion pilot preview: http://127.0.0.1:3102/"),
  );
