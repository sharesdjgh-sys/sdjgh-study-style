import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import {
  run,
  specs,
  artRoot,
  outputRoot,
  estimate,
} from "./character-video-common.mjs";

// Saved sources only; this command cannot make paid API requests.
const work = ".artifacts/character-videos/eight-second-review";
const recordsRoot = `${artRoot}/eight-second-delivery`;
await mkdir(work, { recursive: true });
await mkdir(recordsRoot, { recursive: true });
const melo = "auditory-solo-flexible";
const selectedCode = process.argv
  .find((arg) => arg.startsWith("--code="))
  ?.slice(7);
const characters = [{ code: "visual-solo-planned", name: "루미" }, ...specs];
if (selectedCode && !characters.some((c) => c.code === selectedCode))
  throw new Error("Unknown character");
for (const character of characters.filter((c) =>
  selectedCode ? c.code === selectedCode : c.code !== melo,
)) {
  const isMelo = character.code === melo;
  const source = isMelo
    ? ".artifacts/melo-video-v2/raw.mp4"
    : `${outputRoot}/${character.code === "visual-solo-planned" ? "lumi-loop-v2" : `${character.code}-loop-v1`}.mp4`;
  const filename = `${character.code}-loop-8s-${isMelo ? "v2" : "v1"}`;
  const video = `${outputRoot}/${filename}.mp4`;
  const poster = `${outputRoot}/${filename}.webp`;
  const closingFrames =
    {
      "visual-solo-flexible": 6,
      "tactile-solo-planned": 10,
      "motion-solo-flexible": 12,
    }[character.code] ?? 0;
  const encoding = [
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
  ];
  if (isMelo) {
    const generation = JSON.parse(
      await readFile(".artifacts/melo-video-v2/generation.json", "utf8"),
    );
    if (generation.status !== "completed")
      throw new Error("Melo generation is not complete");
  }
  if (closingFrames) {
    const first = `${work}/${character.code}-first.png`;
    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      source,
      "-frames:v",
      "1",
      "-update",
      "1",
      first,
    ]);
    const start = (191 - closingFrames) / 24;
    const weight = `if(lt(T,${start}),1,max(0,(7.958333333333-T)/${closingFrames / 24}))`;
    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      source,
      "-loop",
      "1",
      "-framerate",
      "24",
      "-i",
      first,
      "-filter_complex",
      `[1:v]format=yuv420p[still];[0:v][still]blend=all_expr='A*${weight}+B*(1-${weight})':shortest=1[out]`,
      "-map",
      "[out]",
      "-t",
      "8",
      "-frames:v",
      "192",
      ...encoding,
      video,
    ]);
  } else {
    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      source,
      "-vf",
      isMelo ? "crop=720:720:280:0,fps=24" : "fps=24",
      "-t",
      "8",
      "-frames:v",
      "192",
      ...encoding,
      video,
    ]);
  }
  const first = run("ffmpeg", [
    "-v",
    "error",
    "-i",
    video,
    "-frames:v",
    "1",
    "-f",
    "image2pipe",
    "-vcodec",
    "png",
    "-",
  ]);
  await sharp(first).webp({ quality: 92 }).toFile(poster);
  run("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"]);
  const delivery = JSON.parse(
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
  const stream = delivery.streams.find((s) => s.codec_type === "video");
  if (
    Number(delivery.format.duration) !== 8 ||
    Number(stream.nb_frames) !== 192 ||
    stream.r_frame_rate !== "24/1" ||
    stream.width !== 720 ||
    stream.height !== 720 ||
    delivery.streams.some((s) => s.codec_type === "audio")
  )
    throw new Error(`${character.code}: unexpected delivery format`);
  const endpoints = run("ffmpeg", [
    "-v",
    "error",
    "-i",
    video,
    "-vf",
    "select=eq(n\\,0)+eq(n\\,191),scale=180:180",
    "-vsync",
    "0",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "-",
  ]);
  const size = 180 * 180 * 3;
  if (endpoints.length !== size * 2) throw new Error("Missing endpoints");
  let difference = 0;
  for (let i = 0; i < size; i++)
    difference += Math.abs(endpoints[i] - endpoints[i + size]);
  const record = {
    code: character.code,
    name: character.name,
    source,
    video,
    poster,
    createdAt: new Date().toISOString(),
    seconds: 8,
    delivery,
    newPaidRequests: isMelo ? 1 : 0,
    closingBlendFrameIntervals: closingFrames,
    boundaryMeanPixelDifference: difference / size,
    processing: isMelo
      ? "New corrected two-arm source; center-square crop; eight seconds at original speed."
      : `First eight seconds at original speed; removed final two seconds.${closingFrames ? ` Final ${closingFrames} frame intervals blended toward the actual first frame; no ending hold.` : " No crossfade."} No reversal or new generation.`,
  };
  if (isMelo) {
    const generation = JSON.parse(
      await readFile(".artifacts/melo-video-v2/generation.json", "utf8"),
    );
    Object.assign(record, {
      model: generation.model,
      usage: generation.usage,
      estimatedUSD: estimate(generation.usage),
    });
  }
  await writeFile(
    `${recordsRoot}/${character.code}.json`,
    JSON.stringify(record, null, 2),
  );
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    video,
    "-vf",
    "fps=1,scale=240:240,tile=4x2",
    "-frames:v",
    "1",
    "-update",
    "1",
    `${work}/${character.code}-storyboard.png`,
  ]);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    video,
    "-vf",
    "select=eq(n\\,0)+eq(n\\,191),scale=360:360,tile=2x1",
    "-frames:v",
    "1",
    "-update",
    "1",
    `${work}/${character.code}-boundary.png`,
  ]);
  console.log(
    JSON.stringify({
      code: character.code,
      seconds: 8,
      closingFrames,
      boundaryMAD: record.boundaryMeanPixelDifference,
      newPaidRequests: record.newPaidRequests,
      estimatedUSD: record.estimatedUSD,
    }),
  );
}
