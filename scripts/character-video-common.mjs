import { execFileSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import sharp from "sharp";

export const workRoot = ".artifacts/character-videos";
export const artRoot = "art/characters/motion";
export const outputRoot = "public/characters/motion";
export const colors = {
  visual: "#e3e9d7",
  auditory: "#f6e3d0",
  tactile: "#ece2f2",
  motion: "#deebee",
};
export const specs = JSON.parse(
  await readFile(`${artRoot}/characters.json`, "utf8"),
);
if (specs.length !== 15 || new Set(specs.map((s) => s.code)).size !== 15)
  throw new Error("Expected 15 unique new characters");
export const run = (command, args) =>
  execFileSync(command, args, {
    windowsHide: true,
    stdio: "pipe",
    maxBuffer: 8 * 1024 * 1024,
  });
export function promptFor(spec) {
  return `[# Sources <FIRST_FRAME>@Image1 <LAST_FRAME>@Image1]
Create a 10-second seamless idle-animation loop from Image1. Use Image1 as both the exact first frame and exact last frame. One continuous shot, locked camera, identical framing, character scale and lighting throughout. Several seconds separate the small gestures; this is a relaxed collectible character portrait.

The exact subject is ${spec.name}, a ${spec.species}: ${spec.identity}. The character is ${spec.personality}. Keep the original soft, tactile 3D toy materials, eye shape and highlights, fur or feather details, clothing, accessories, rigid props and facial identity. Preserve the number, color and shape of every existing object. Keep the plain background exactly unchanged. Maintain the original smile and mouth shape without speech animation. Never redraw, restyle or substitute the character.

Motion choreography:
[0.0-1.5s] Hold the exact reference pose, eyes open. Almost imperceptible relaxed breathing only.
[1.5-3.5s] ${spec.observe}
[3.5-6.0s] ${spec.gesture}
[6.0-7.0s] ${spec.reaction}
[7.0-9.0s] Slowly return every moving part, gaze and breathing to the exact reference pose. Ease to zero velocity without an abrupt reversal.
[9.0-10.0s] Hold the identical starting pose, eyes open and still. The final frame must match Image1 and the first frame so repeated playback has no visible jump.

Only this choreography occurs. No additional characters, text, writing, captions, speech, music, new objects, extra limbs, detached fingers, prop transformations, color shifts, camera movement, cuts, transitions, dissolves or fade-in/fade-out. All decorative objects stay fixed. Silent video. Keep the full subject inside the original frame and preserve the original pose outside the small specified gestures.
`;
}
export async function prepareInput(spec) {
  const directory = `${workRoot}/${spec.code}`;
  await mkdir(directory, { recursive: true });
  const character = await sharp(`public/characters/${spec.code}.webp`)
    .resize(656, 656)
    .png()
    .toBuffer();
  const frame = await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 3,
      background: colors[spec.code.split("-")[0]],
    },
  })
    .composite([{ input: character, left: 312, top: 32 }])
    .png()
    .toBuffer();
  await writeFile(`${directory}/first-frame.png`, frame);
  const prompt = promptFor(spec);
  await mkdir(`${artRoot}/prompts`, { recursive: true });
  await writeFile(`${artRoot}/prompts/${spec.code}.txt`, prompt);
  return { directory, frame, prompt };
}
export function estimate(usage) {
  const videoTokens = usage.output_tokens_by_modality.find(
    (t) => t.modality === "video",
  ).tokens;
  return (
    (usage.total_input_tokens * 1.5) / 1e6 +
    (videoTokens * 17.5) / 1e6 +
    ((usage.total_output_tokens -
      videoTokens +
      (usage.total_thought_tokens ?? 0)) *
      9) /
      1e6
  );
}
export async function prepareOutput(spec) {
  const directory = `${workRoot}/${spec.code}`;
  const generation = JSON.parse(
    await readFile(`${directory}/generation.json`, "utf8"),
  );
  if (generation.status !== "completed")
    throw new Error(`${spec.code}: generation is not complete`);
  await mkdir(outputRoot, { recursive: true });
  const video = `${outputRoot}/${spec.code}-loop-v1.mp4`;
  const poster = video.replace(/\.mp4$/, ".webp");
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    `${directory}/raw.mp4`,
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
  const closeLoop = spec.code === "motion-solo-flexible";
  if (closeLoop) {
    // The generated rabbit's matte drifts at the end. Ease the near-identical
    // resting pose into the actual first frame, preserving the full ten seconds.
    const first = `${directory}/closing-reference.png`;
    const closed = `${directory}/loop-closed.mp4`;
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
      first,
    ]);
    const weight = "if(lt(T,9),1,max(0,(9.9583333333-T)/0.9583333333))";
    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      video,
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
      "10",
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
      closed,
    ]);
    await rename(closed, video);
  }
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
    `${directory}/poster.png`,
  ]);
  await sharp(`${directory}/poster.png`).webp({ quality: 92 }).toFile(poster);
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
    stream.r_frame_rate !== "24/1" ||
    Number(stream.nb_frames) !== 240 ||
    Math.abs(Number(probe.format.duration) - 10) > 0.1 ||
    probe.streams.some((s) => s.codec_type === "audio")
  )
    throw new Error(`${spec.code}: unexpected format or duration`);
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
  if (frames.length !== frameSize * 2)
    throw new Error("Missing endpoint frames");
  let difference = 0;
  for (let i = 0; i < frameSize; i++)
    difference += Math.abs(frames[i] - frames[i + frameSize]);
  const metadata = {
    character: spec.code,
    name: spec.name,
    action: spec.action,
    model: generation.model,
    generatedAt: generation.finishedAt,
    paidRequests: 1,
    requestedSeconds: 10,
    delivery: probe,
    estimatedUSD: estimate(generation.usage),
    usage: generation.usage,
    boundaryMeanPixelDifference: difference / frameSize,
    processing: closeLoop
      ? "Center square crop; audio removed; H.264 yuv420p and faststart; final 23 frame intervals gently blended to the actual first frame to close background-color drift; no reverse playback or additional paid generation."
      : "Center square crop; audio removed; H.264 yuv420p and faststart; no reverse playback or crossfade.",
  };
  await mkdir(`${artRoot}/generations`, { recursive: true });
  await writeFile(
    `${artRoot}/generations/${spec.code}.json`,
    JSON.stringify(metadata, null, 2),
  );
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    video,
    "-vf",
    "fps=1,scale=180:180,tile=5x2",
    "-frames:v",
    "1",
    "-update",
    "1",
    `${directory}/storyboard.png`,
  ]);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    video,
    "-vf",
    `select=eq(n\\,0)+eq(n\\,${Number(stream.nb_frames) - 1}),scale=360:360,tile=2x1`,
    "-frames:v",
    "1",
    "-update",
    "1",
    `${directory}/boundary.png`,
  ]);
  return metadata;
}
