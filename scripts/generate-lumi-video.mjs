import { loadEnvFile } from "node:process";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import sharp from "sharp";

// One character, one paid request. Never invoked by the app or a build.
const version =
  process.argv.find((arg) => arg.startsWith("--version="))?.slice(10) ?? "v2";
if (!["v1", "v2"].includes(version))
  throw new Error("Use --version=v1 or --version=v2");
const seconds = version === "v1" ? 4 : 10;
const work =
  version === "v1" ? ".artifacts/lumi-video" : ".artifacts/lumi-video-v2";
const recordPath = `${work}/generation.json`;
await mkdir(work, { recursive: true });
const character = await sharp("public/characters/visual-solo-planned.webp")
  .resize(656, 656)
  .png()
  .toBuffer();
const firstFrame = await sharp({
  create: { width: 1280, height: 720, channels: 3, background: "#e3e9d7" },
})
  .composite([{ input: character, left: 312, top: 32 }])
  .png()
  .toBuffer();
await writeFile(`${work}/first-frame.png`, firstFrame);
await sharp(firstFrame)
  .extract({ left: 280, top: 0, width: 720, height: 720 })
  .webp({ quality: 92 })
  .toFile(`${work}/poster.webp`);
const prompt = await readFile(
  version === "v1"
    ? "art/characters/motion/lumi.prompt.txt"
    : "art/characters/motion/lumi-v2.prompt.txt",
  "utf8",
);
if (!process.argv.includes("--generate")) {
  console.log(
    "Prepared Lumi's first/last frame. Add --generate for ONE paid request.",
  );
  process.exit(0);
}
for (const existing of [
  recordPath,
  `public/characters/motion/lumi-loop-${version}.mp4`,
]) {
  try {
    await access(existing);
    throw new Error(
      `Existing attempt or video found: ${existing}. Inspect it before any intentional retry.`,
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
loadEnvFile(".env.local");
const key = process.env.GEMINI_API_KEY?.trim();
if (!key) throw new Error("Missing GEMINI_API_KEY");
const sanitize = (value) =>
  String(value ?? "")
    .split(key)
    .join("[REDACTED]")
    .replace(/AIza[\w-]+/g, "[REDACTED]");
const record = {
  startedAt: new Date().toISOString(),
  model: "gemini-omni-1.1-flash",
  version,
  resolution: "720p",
  requestedSeconds: seconds,
  requests: 1,
  status: "started",
};
await writeFile(recordPath, JSON.stringify(record, null, 2), { flag: "wx" });
console.log(JSON.stringify(record));
try {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        model: record.model,
        input: [
          {
            type: "image",
            data: firstFrame.toString("base64"),
            mime_type: "image/png",
          },
          { type: "text", text: prompt },
        ],
        response_format: {
          type: "video",
          resolution: "720p",
          aspect_ratio: "16:9",
        },
        background: false,
        store: false,
        stream: false,
      }),
      signal: AbortSignal.timeout(600000),
    },
  );
  const data = await response.json();
  record.httpStatus = response.status;
  if (!response.ok)
    throw new Error(sanitize(data.error?.message ?? `HTTP ${response.status}`));
  const contents = (data.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? []);
  const video = contents.find((part) => part.type === "video");
  let bytes;
  if (video?.data) bytes = Buffer.from(video.data, "base64");
  else if (video?.uri) {
    const url = new URL(video.uri);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "generativelanguage.googleapis.com"
    )
      throw new Error("Unexpected download host");
    const download = await fetch(url, {
      headers: { "x-goog-api-key": key },
      redirect: "error",
      signal: AbortSignal.timeout(60000),
    });
    if (!download.ok)
      throw new Error(`Download failed: HTTP ${download.status}`);
    bytes = Buffer.from(await download.arrayBuffer());
  } else throw new Error("No video returned");
  await writeFile(`${work}/lumi-raw.mp4`, bytes);
  Object.assign(record, {
    status: "completed",
    finishedAt: new Date().toISOString(),
    bytes: bytes.length,
    usage: data.usage,
  });
  console.log(
    JSON.stringify({
      status: record.status,
      bytes: bytes.length,
      usage: record.usage,
    }),
  );
} catch (error) {
  Object.assign(record, {
    status: "failed-or-unknown",
    message: sanitize(error.message),
    causeCode: error.cause?.code,
  });
  console.error(
    JSON.stringify({
      status: record.status,
      message: record.message,
      causeCode: record.causeCode,
    }),
  );
  process.exitCode = 1;
} finally {
  await writeFile(recordPath, JSON.stringify(record, null, 2));
}
