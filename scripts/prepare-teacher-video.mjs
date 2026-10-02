import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const work = ".artifacts/teacher-video-v1";
const output = "public/characters/motion";
const run = (command, args) =>
  execFileSync(command, args, {
    windowsHide: true,
    stdio: "pipe",
    maxBuffer: 16 * 1024 * 1024,
  });
const probe = (path) =>
  JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,duration",
      "-of",
      "json",
      path,
    ]),
  );
await mkdir(output, { recursive: true });
const records = [];
for (const part of [1, 2]) {
  const record = JSON.parse(
    await readFile(`${work}/part-${part}/generation.json`, "utf8"),
  );
  if (record.status !== "completed")
    throw new Error(`Part ${part} not complete`);
  const input = `${work}/part-${part}/raw.mp4`;
  const info = probe(input);
  if (
    Math.abs(Number(info.format.duration) - 8) > 0.1 ||
    !info.streams.some((s) => s.codec_type === "audio")
  )
    throw new Error(`Part ${part} must contain 8 seconds and audio`);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    input,
    "-vf",
    "crop=720:720:280:0,setsar=1,fps=24,tpad=stop_mode=clone:stop_duration=0.1,trim=duration=8,setpts=PTS-STARTPTS",
    "-af",
    "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,afade=t=in:d=0.04,afade=t=out:st=7.96:d=0.04",
    "-t",
    "8",
    "-c:v",
    "libx264",
    "-crf",
    "20",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    `${output}/teacher-tori-part-${part}-8s-v1.mp4`,
  ]);
  records.push({ part, source: info, generation: record });
}
const final = `${output}/teacher-tori-welcome-16s-v1.mp4`;
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  `${output}/teacher-tori-part-1-8s-v1.mp4`,
  "-i",
  `${output}/teacher-tori-part-2-8s-v1.mp4`,
  "-filter_complex",
  "[0:v]setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[0:a]atrim=duration=8,asetpts=PTS-STARTPTS[a0];[1:a]atrim=duration=8,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]",
  "-map",
  "[v]",
  "-map",
  "[a]",
  "-t",
  "16",
  "-c:v",
  "libx264",
  "-crf",
  "20",
  "-preset",
  "slow",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-movflags",
  "+faststart",
  final,
]);
run("ffmpeg", ["-v", "error", "-i", final, "-f", "null", "-"]);
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  final,
  "-frames:v",
  "1",
  "-update",
  "1",
  `${work}/poster.png`,
]);
await sharp(`${work}/poster.png`)
  .webp({ quality: 90 })
  .toFile(`${output}/teacher-tori-welcome-poster.webp`);
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  final,
  "-vf",
  "fps=1,scale=180:180,tile=8x2",
  "-frames:v",
  "1",
  "-update",
  "1",
  `${work}/storyboard.png`,
]);
const delivery = probe(final);
if (Math.abs(Number(delivery.format.duration) - 16) > 0.1)
  throw new Error("Unexpected final duration");
await writeFile(
  "art/characters/motion/teacher/delivery.json",
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      video: final,
      parts: records,
      delivery,
      processing:
        "Two separately generated 8-second clips, central square crop, normalized dialogue, sequential concat without time stretching or reverse playback. H.264/AAC, faststart.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ stage: "prepared", delivery }));
