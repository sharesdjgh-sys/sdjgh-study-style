import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
const family = process.argv
  .find((arg) => arg.startsWith("--family="))
  ?.slice(9);
if (!["visual", "auditory", "tactile", "motion"].includes(family))
  throw new Error("Unknown family");
const work = `.artifacts/family-videos/${family}`;
const output = `art/characters/special/families/${family}-loop-8s-v1.mp4`;
const record = JSON.parse(await readFile(`${work}/generation.json`, "utf8"));
if (record.status !== "completed")
  throw new Error("Generation not completed; no API call made");
const run = (cmd, args) =>
  execFileSync(cmd, args, {
    windowsHide: true,
    stdio: "pipe",
    maxBuffer: 32 * 1024 * 1024,
  });
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  `${work}/raw.mp4`,
  "-t",
  "8",
  "-vf",
  "fps=24,scale=1280:720",
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
  output,
]);
run("ffmpeg", ["-v", "error", "-i", output, "-f", "null", "-"]);
const probe = JSON.parse(
  run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size:stream=codec_type,width,height,r_frame_rate,nb_frames",
    "-of",
    "json",
    output,
  ]),
);
const video = probe.streams.find((s) => s.codec_type === "video");
if (
  video.width !== 1280 ||
  video.height !== 720 ||
  Number(video.nb_frames) !== 192 ||
  Number(probe.format.duration) !== 8 ||
  probe.streams.some((s) => s.codec_type === "audio")
)
  throw new Error("Unexpected delivery format");
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  output,
  "-vf",
  "fps=1,scale=384:216,tile=4x2",
  "-frames:v",
  "1",
  `${work}/contact.jpg`,
]);
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  output,
  "-vf",
  "select='eq(n,0)+eq(n,1)+eq(n,190)+eq(n,191)',scale=480:270,tile=2x2",
  "-frames:v",
  "1",
  `${work}/boundary.jpg`,
]);
const pixels = run("ffmpeg", [
  "-v",
  "error",
  "-i",
  output,
  "-vf",
  "scale=160:90",
  "-f",
  "rawvideo",
  "-pix_fmt",
  "rgb24",
  "-",
]);
const size = 160 * 90 * 3;
function difference(a, b) {
  let sum = 0;
  for (let i = 0; i < size; i++)
    sum += Math.abs(pixels[a * size + i] - pixels[b * size + i]);
  return sum / size;
}
const perSecond = Array.from({ length: 8 }, (_, second) => {
  let sum = 0;
  for (let n = second * 24; n < second * 24 + 23; n++)
    sum += difference(n, n + 1);
  return sum / 23;
});
const videoTokens = record.usage.output_tokens_by_modality.find(
  (m) => m.modality === "video",
).tokens;
const estimatedUSD =
  (record.usage.total_input_tokens * 1.5) / 1e6 +
  (videoTokens * 17.5) / 1e6 +
  ((record.usage.total_output_tokens -
    videoTokens +
    (record.usage.total_thought_tokens ?? 0)) *
    9) /
    1e6;
const result = {
  ...record,
  output,
  delivery: probe,
  estimatedUSD,
  boundaryMeanPixelDifference: difference(0, 191),
  meanFrameDifferencePerSecond: perSecond,
};
await writeFile(
  `art/characters/special/families/motion/${family}.json`,
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({
    family,
    estimatedUSD,
    delivery: probe,
    boundary: result.boundaryMeanPixelDifference,
    perSecond,
  }),
);
