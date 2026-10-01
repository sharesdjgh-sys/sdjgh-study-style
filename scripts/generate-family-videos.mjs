import { loadEnvFile } from "node:process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Explicit offline command only. One request; never retry an ambiguous attempt.
const family = process.argv
  .find((arg) => arg.startsWith("--family="))
  ?.slice(9);
if (!["visual", "auditory", "tactile", "motion"].includes(family))
  throw new Error("Use --family=visual|auditory|tactile|motion");
const work = `.artifacts/family-videos/${family}`;
const recordPath = `${work}/generation.json`;
await mkdir(work, { recursive: true });
const source = `art/characters/special/families/${family}.png`;
const promptPath = `art/characters/special/families/motion/${family}.prompt.txt`;
const frame = await sharp(source).resize(1280, 720).png().toBuffer();
await writeFile(`${work}/first-frame.png`, frame);
const prompt = await readFile(promptPath, "utf8");
if (!process.argv.includes("--generate")) {
  console.log(
    JSON.stringify({ stage: "prepared", paidRequests: 0, seconds: 8 }),
  );
  process.exit(0);
}
for (const path of [
  recordPath,
  `art/characters/special/families/${family}-loop-8s-v1.mp4`,
]) {
  try {
    await access(path);
    throw new Error(`Existing attempt: ${path}; inspect before any retry`);
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
  family,
  model: "gemini-omni-1.1-flash",
  source,
  prompt: promptPath,
  requestedSeconds: 8,
  resolution: "720p",
  requests: 1,
  startedAt: new Date().toISOString(),
  status: "started",
};
await writeFile(recordPath, JSON.stringify(record, null, 2), { flag: "wx" });
console.log(JSON.stringify({ stage: "request", seconds: 8, requests: 1 }));
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
            data: frame.toString("base64"),
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
  const video = (data.steps ?? [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .find((c) => c.type === "video");
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
  await writeFile(`${work}/raw.mp4`, bytes);
  Object.assign(record, {
    status: "completed",
    finishedAt: new Date().toISOString(),
    bytes: bytes.length,
    usage: data.usage,
  });
  console.log(
    JSON.stringify({
      stage: "completed",
      bytes: bytes.length,
      usage: data.usage,
    }),
  );
} catch (error) {
  Object.assign(record, {
    status: "failed-or-unknown",
    message: sanitize(error.message),
    causeCode: error.cause?.code,
  });
  console.error(
    JSON.stringify({ status: record.status, message: record.message }),
  );
  process.exitCode = 1;
} finally {
  await writeFile(recordPath, JSON.stringify(record, null, 2));
}
