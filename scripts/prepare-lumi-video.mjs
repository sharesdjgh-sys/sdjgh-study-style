import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const version =
  process.argv.find((arg) => arg.startsWith("--version="))?.slice(10) ?? "v2";
if (!["v1", "v2"].includes(version))
  throw new Error("Use --version=v1 or --version=v2");
const work =
  version === "v1" ? ".artifacts/lumi-video" : ".artifacts/lumi-video-v2";
const output = "public/characters/motion";
await mkdir(output, { recursive: true });
const raw = `${work}/lumi-raw.mp4`;
const video = `${output}/lumi-loop-${version}.mp4`;
const run = (command, args) =>
  execFileSync(command, args, {
    windowsHide: true,
    stdio: "pipe",
    maxBuffer: 8 * 1024 * 1024,
  });
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  raw,
  "-vf",
  "crop=720:720:280:0",
  "-an",
  "-c:v",
  "libx264",
  "-crf",
  "20",
  "-preset",
  "slow",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  video,
]);
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  video,
  "-frames:v",
  "1",
  "-update",
  "1",
  `${work}/poster-frame.png`,
]);
await sharp(`${work}/poster-frame.png`)
  .webp({ quality: 92 })
  .toFile(`${output}/lumi-loop-${version}.webp`);
run("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"]);
const probe = JSON.parse(
  run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size:stream=codec_type,width,height,r_frame_rate,nb_frames",
    "-of",
    "json",
    video,
  ]),
);
const stream = probe.streams.find((s) => s.codec_type === "video");
if (
  stream.width !== 720 ||
  stream.height !== 720 ||
  probe.streams.some((s) => s.codec_type === "audio")
)
  throw new Error("Unexpected delivery format");
const frames = run("ffmpeg", [
  "-v",
  "error",
  "-i",
  video,
  "-vf",
  `select=eq(n\\,0)+eq(n\\,${Number(stream.nb_frames) - 1})`,
  "-vsync",
  "0",
  "-f",
  "rawvideo",
  "-pix_fmt",
  "rgb24",
  "-",
]);
const frameSize = 720 * 720 * 3;
if (frames.length !== frameSize * 2) throw new Error("Missing endpoint frames");
let difference = 0;
for (let i = 0; i < frameSize; i++)
  difference += Math.abs(frames[i] - frames[i + frameSize]);
const generation = JSON.parse(
  await readFile(`${work}/generation.json`, "utf8"),
);
const usage = generation.usage;
const videoTokens = usage.output_tokens_by_modality.find(
  (t) => t.modality === "video",
).tokens;
const estimatedUSD =
  (usage.total_input_tokens * 1.5) / 1e6 +
  (videoTokens * 17.5) / 1e6 +
  ((usage.total_output_tokens -
    videoTokens +
    (usage.total_thought_tokens ?? 0)) *
    9) /
    1e6;
const metadata = {
  character: "visual-solo-planned",
  name: "루미",
  version,
  model: generation.model,
  generatedAt: generation.finishedAt,
  paidRequests: 1,
  requestedSeconds: generation.requestedSeconds,
  sourceResolution: "1280x720",
  delivery: probe,
  estimatedUSD,
  usage,
  boundaryMeanPixelDifference: difference / frameSize,
  processing:
    "Center square crop; audio removed; H.264 yuv420p and faststart; no reverse playback, crossfade, or extra generation.",
};
await writeFile(
  version === "v1"
    ? "art/characters/motion/lumi-generation.json"
    : "art/characters/motion/lumi-generation-v2.json",
  JSON.stringify(metadata, null, 2),
);
console.log(
  JSON.stringify({
    video,
    duration: probe.format.duration,
    bytes: probe.format.size,
    estimatedUSD,
    boundaryMeanPixelDifference: metadata.boundaryMeanPixelDifference,
  }),
);
