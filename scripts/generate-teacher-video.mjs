import { loadEnvFile } from "node:process";
import { access, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Offline asset generation only; each part permits one paid attempt, no retries.
const part = process.argv.find((arg) => arg.startsWith("--part="))?.slice(7);
if (!["1", "2"].includes(part)) throw new Error("Use --part=1 or --part=2");
const work = `.artifacts/teacher-video-v1/part-${part}`;
const art = "art/characters/motion/teacher";
await mkdir(work, { recursive: true });
await mkdir(art, { recursive: true });
const character = await sharp("public/characters/teacher-tori.webp")
  .resize(656, 656)
  .png()
  .toBuffer();
const frame = await sharp({
  create: {
    width: 1280,
    height: 720,
    channels: 3,
    background: "#e7eee0",
  },
})
  .composite([{ input: character, left: 312, top: 20 }])
  .png()
  .toBuffer();
await writeFile(`${work}/first-frame.png`, frame);
const dialogue =
  part === "1"
    ? "안녕, 친구들! 나는 토리 선생님이야. 만나서 반가워!"
    : "네 이야기를 들려줘! 너를 꼭 닮은, 나만의 공부 캐릭터를 만들어 보자!";
const prompt = `[# Sources <FIRST_FRAME>@Image1${part === "2" ? " <LAST_FRAME>@Image1" : ""}]
Generate exactly 8 seconds of high-quality character animation WITH AUDIBLE KOREAN SPEECH. A single continuous locked-camera shot, no cuts, no zoom. This is part ${part} of a two-part welcome for school students on a Korean study-character website.
Image1 is the exact starting AND ending composition. Tori is the same adorable cream bear teacher with round bronze glasses, sage green knit cardigan, mustard bow tie, brown shoes, and a closed terracotta book. Preserve face, eyes, fur, clothing, book, proportions, colors and gentle soft 3D style. Exactly two arms and two legs. The book stays in the same paw. Full body remains entirely inside the central 680 pixels for a square website crop. Keep the flat pale sage #e7eee0 background perfectly static.
Voice: one warm, friendly adult female Korean teacher voice, medium register, clear standard Seoul Korean, gentle smiling delivery, natural conversation with young students. Not high-pitched, not robotic, not an announcer. No other speakers. Precisely synchronized natural mouth movements. Speak ONLY this exact Korean dialogue, no translation or additional words: "${dialogue}"
[0.0-0.4s] Smile and look warmly at the viewer in the reference pose.
[0.4-6.8s] ${part === "1" ? "Gently wave the already raised free paw twice while greeting students, introduce herself with a little nod, then smile warmly." : "Give a small encouraging nod, turn the already raised free paw into a small open-palm inviting gesture toward the viewer while inviting them to create their own study character."} Deliver the entire dialogue clearly without rushing, in the same warm voice throughout.
[6.8-8.0s] Finish all speech by 7.0 seconds. Return gently to exactly the reference pose, eyes open, book fixed, small friendly smile. Hold still for the final 0.4 seconds, no speech at the cut.
Audio: clean close-mic Korean dialogue only, quiet room, no music, no sound effects, no ambient hum, no echo. Do not add any subtitles, lettering, graphics, props, extra limbs or other characters. No fades or transitions. Do not change character identity or camera framing. This is actual talking character animation, not a still-image pan.`;
await writeFile(`${art}/part-${part}.prompt.txt`, prompt);
if (!process.argv.includes("--generate")) {
  console.log(JSON.stringify({ stage: "prepared", part, paidRequests: 0 }));
  process.exit(0);
}
const recordPath = `${work}/generation.json`;
try {
  await access(recordPath);
  throw new Error(
    "Existing attempt: inspect its record; automatic retry is disabled",
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
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
  model: "gemini-omni-1.1-flash",
  part,
  requestedSeconds: 8,
  source: "public/characters/teacher-tori.webp",
  dialogue,
  prompt: `${art}/part-${part}.prompt.txt`,
  resolution: "720p",
  status: "started",
  requests: 1,
  startedAt: new Date().toISOString(),
};
await writeFile(recordPath, JSON.stringify(record, null, 2), { flag: "wx" });
console.log(JSON.stringify({ stage: "request", part, seconds: 8 }));
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
  const video =
    data.output_video ??
    (data.steps ?? [])
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
    JSON.stringify({ stage: "completed", part, bytes: bytes.length }),
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
  await writeFile(
    `${art}/part-${part}.generation.json`,
    JSON.stringify(record, null, 2),
  );
}
