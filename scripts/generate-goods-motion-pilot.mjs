import { loadEnvFile } from "node:process";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import sharp from "sharp";

// Offline pilot only. One paid request per character; never automatically retry.
const loopV2 = process.argv.includes("--loop-v2");
const lumiFix = process.argv.includes("--lumi-fix-v3");
const lumi15 = process.argv.includes("--lumi-15s");
const twoPart = process.argv.includes("--lumi-two-part");
const gazeRevision = process.argv.includes("--gaze-revision");
if (gazeRevision && !twoPart) throw Error("Gaze revision requires --lumi-two-part");
if ([loopV2, lumiFix, lumi15, twoPart].filter(Boolean).length > 1) throw Error("Choose one generation version");
const root = gazeRevision ? "ref/goods-motion-lumi-15s-gaze-v2" : lumi15 || twoPart ? "ref/goods-motion-lumi-15s" : lumiFix ? "ref/goods-motion-lumi-v3" : loopV2 ? "ref/goods-motion-pilot-v2" : "ref/goods-motion-pilot-v1";
const selected = process.argv
  .find((arg) => arg.startsWith("--character="))
  ?.slice(12);
if (lumiFix && selected !== "lumi") throw Error("Lumi correction requires --character=lumi");
if (lumi15 && selected !== "lumi") throw Error("15-second pilot requires --character=lumi");
if (twoPart && selected) throw Error("Two-part pilot generates the two approved segments together");
const specs = {
  lumi: {
    title: "내가 이은 첫 번째 별자리",
    code: "visual-solo-planned",
    action: `Lumi is the sage-green and ivory owl with round gold glasses and a navy embroidered cape. Preserve the exact face, two wing-arms, clothing and one rigid brass ruler.
[0-2 seconds] Lumi looks down at the final unconnected point at the right end of the star diagram. Only a tiny thoughtful head tilt.
[2-5 seconds] The wing holding the brass ruler lowers it to align the last short gap on the chart. A short golden line connects the existing last large star to the tiny endpoint. The other wing stays resting on the table. The existing connected stars illuminate one after another.
[5-8 seconds] A miniature luminous duplicate of this completed five-point star path gently rises only 10 centimeters above the chart, below Lumi's chin, while the printed chart remains on the table. This is one delicate connected constellation, not a shower of particles. Lumi follows it with the eyes.
[8-10 seconds] Lumi lowers the ruler to rest and makes a subtle pleased smile. Hold the luminous constellation steady above the chart for the final second. Keep the face unobscured.`,
  },
  melo: {
    title: "코코아에서 태어난 질문",
    code: "auditory-solo-flexible",
    action: `Melo is the cream and orange kitten with peach headphones and lavender cape. Preserve the exact facial patch, eye shape, two ears, headphones, cape and exactly TWO front paws. Both paws stay planted on the tabletop for the entire video. The mug never moves.
[0-2 seconds] Melo looks toward the natural steam over the cocoa mug and perks one ear, curious.
[2-5 seconds] Melo slowly tilts the head about ten degrees toward the mug. A single ribbon of steam curls into a subtle question-mark silhouette ABOVE the mug and to the RIGHT of the face. No printed text or solid punctuation object.
[5-8 seconds] The same soft translucent steam curls and briefly resembles a tiny friendly whale with a rounded nose, two small fins and tail, about the width of the mug. The vapor whale swims once in a small gentle arc above the mug. It remains vapor, not a new solid animal.
[8-10 seconds] Melo looks at it with a tiny delighted smile and alert eyes. The whale naturally dissolves back into ordinary wisps of steam. End with both paws still clearly visible on the desk. Never touch the headphones or face.`,
  },
  block: {
    title: "네 조각까지, 이제 완성",
    code: "tactile-team-planned",
    action: `There are exactly TWO characters: Block, the larger bear in ochre cape on the LEFT, and Tori, the smaller beaver with two little front teeth and lavender apron on the RIGHT. Both retain exactly two front paws. Block's two paws stay close together on the LEFT bridge support. Tori's two paws hold the single connector plank. Keep the distinct faces and costumes exactly.
[0-2 seconds] Both look down at the small toy bridge. Block steadies the left support with both paws while Tori aligns the connector plank over the center gap.
[2-5 seconds] Tori lowers the ONE connector with both paws and fits it across the narrow gap, forming a continuous shallow track between the two wooden supports. The supports do not change shape or position. Block remains steady.
[5-8 seconds] Tori releases the connector and withdraws both paws to his own side. Block gives the single wooden marble already on the left track one small nudge with his LEFT paw. The marble rolls smoothly left-to-right along the track, crosses the fitted connector, and stops near the right end. No teleporting, no new marble.
[8-10 seconds] Block and Tori look at each other and share a quiet satisfied smile. The finished bridge, fitted connector and one marble remain in their final positions. Hold for the last second. No extra arms, no handshakes, no celebratory hand gestures.`,
  },
};
if (selected && !specs[selected]) throw Error("Unknown pilot character");
let shared = `[# Sources <FIRST_FRAME>@Image1]
Create exactly 10 seconds of animation from this first frame, one continuous unbroken shot with a locked camera, no cuts, no zoom, no reframing. This is a premium collectible story card, not an idle portrait and not a loop. Preserve the soft tactile 3D storybook rendering, character identities, anatomy, proportions, fur, costumes, lighting and all fixed background details. Keep the starting composition and scale. All story action must stay within the central 84 percent of the portrait frame height; the thin extra background at top and bottom will be cropped. Do not stretch, morph or duplicate any character or solid prop. No subtitles, captions, UI, added lettering, camera shake, flashes or fade-out. Silent video: no speech, music or sound effects. The only changes are the following small physical actions and the specifically described effect. Finish the story and hold its final pose; do not reverse the action to make a loop.
`;
if (loopV2 || lumiFix) {
  const revision = JSON.parse(await readFile("scripts/goods-motion-loop-v2.json", "utf8"));
  shared = revision.shared;
  for (const [id, action] of Object.entries(revision.actions)) specs[id].action = action;
}
if (lumiFix) {
  shared = shared.replace("<LAST_FRAME>@Image1", "<LAST_FRAME>@Image2").replace("Use Image1 as BOTH the exact first and exact last frame.", "Image1 is the first frame; Image2 is the mandatory last frame. These two source images are identical. Match both precisely, including the window frame, background stars, face angle and all props. Do not reinterpret the final image.");
  specs.lumi.action = "Lumi is the owl in the image. Exactly one straight solid ruler and both wings remain rigid and stationary in their reference locations throughout. Keep the head, eyes, glasses, body, costume and entire background fixed in the precise original pose. Only one soft blink around second 3 and a magical light effect animate. 0-2s: original pose. 2-4s: the EXISTING constellation lines on the chart glow gently. 4-6s: a very faint translucent copy of those exact connected points floats only 3 centimeters above the chart, far below the face. 6-8s: this extra light naturally dissipates upward; the original printed chart is unchanged. 8-10s: original pose, original star-chart brightness, original background and open eyes, precisely matching Image2. No head turn, no gaze shift, no nod, no prop movement, no camera motion, no star-field drift, no changed window perspective. The last two seconds must be visually the same as the first two seconds. Never split, rotate, hinge, bend, lift or duplicate the ruler.";
}
if (lumi15) {
  shared = `[# Sources <FIRST_FRAME>@Image1 <LAST_FRAME>@Image2]
Create exactly 15 seconds of lively character animation in one continuous locked-camera shot. Image1 is the exact first frame and Image2 is the exact final frame; the images are identical so the clip loops. Preserve this tactile 3D storybook owl, costume, glasses, desk, background and lighting. This is a character acting out a small story, with visible purposeful wing, head and eye movement, not a frozen portrait. Let the return take the full last five seconds. Natural forward animation, no reversed playback, no crossfade or scene cuts. Actions stay in the central 84 percent of the portrait height. Silent, no dialogue or captions.`;
  specs.lumi.action = `Exactly two wing-arms and ONE straight rigid brass ruler. Lumi's right-side wing in the image keeps the same continuous grip on the same end of the ruler throughout. This ruler is one solid piece with a fixed length and thickness; not a compass, two sticks, a folding ruler or a hinge. The left-side wing rests on the desk. Keep the ruler nearly horizontal and visible, moving it as a single rigid object without rolling it edge-on.
[0-2 seconds] Starting in Image1's exact pose, Lumi looks down and leans forward slightly with an interested head tilt.
[2-5 seconds] The gripping wing deliberately moves the ruler down and a short distance across the chart, keeping it nearly horizontal. A thin golden trace follows its tip along the last existing star-path segment. The owl watches the tip. This is a clearly visible drawing gesture, not a large flourish.
[5-7 seconds] The completed star path brightens. Lumi lifts the chin and eyes, eyebrows subtly rising in delight. The ruler remains securely held over the table.
[7-10 seconds] A small connected constellation rises from the chart, below the beak. Lumi follows it with a gentle head movement and delighted smile. The face stays unobscured.
[10-12 seconds] The constellation gently settles into the matching star points on the chart and its extra glow fades to the original brightness. Lumi follows it downward with the eyes.
[12-14 seconds] With a new natural return gesture, the gripping wing brings the single ruler back to the precise starting position and angle. Head, posture and gaze also ease back to Image2's reference pose. No prop release or teleportation.
[14-15 seconds] Settle softly into the exact original open-eyed pose and lighting. The end and beginning have near-zero movement speed. Match the background window, stars, both wings, ruler and facial angle to Image2 without a final-frame snap.`;
}
if (twoPart) {
  const plan = JSON.parse(await readFile(`${root}/prompts/lumi-two-part-plan.json`, "utf8"));
  for (const id of Object.keys(specs)) delete specs[id];
  for (const segment of plan.segments) specs[`lumi-${segment.id}`] = { ...segment, title: "내가 이은 첫 번째 별자리", code: "visual-solo-planned" };
  shared = `[# Sources <FIRST_FRAME>@Image1 <LAST_FRAME>@Image2]\nImage1 is the literal first frame, Image2 the exact last frame. One continuous shot of the same owl Lumi. Maintain the tactile 3D storybook rendering. Keep all important action in the central 84 percent of frame height. The ruler is a single solid straight object, never two sticks or a hinged compass. The wing keeps gripping the same end throughout the visible drawing and return gestures. ${plan.common}`;
}
await mkdir(`${root}/records`, { recursive: true });
await mkdir(`${root}/prompts`, { recursive: true });
await mkdir(`${root}/raw`, { recursive: true });
await mkdir(`${root}/inputs`, { recursive: true });
if (process.argv.includes("--generate")) loadEnvFile(".env.local");
const key = process.env.GEMINI_API_KEY?.trim();
if (process.argv.includes("--generate") && !key)
  throw Error("Missing GEMINI_API_KEY");
const sanitize = (value) =>
  String(value ?? "")
    .split(key || "__NO_KEY__")
    .join("[REDACTED]")
    .replace(/AIza[\w-]+/g, "[REDACTED]");
for (const [id, spec] of Object.entries(specs).filter(
  ([id]) => !selected || selected === id,
)) {
  const prompt = `${shared}\n${twoPart ? `Create exactly ${spec.seconds} seconds of animation. ` : ""}${spec.action}\nUse Image1 as the literal first frame. Maintain the initial number of limbs and props in every frame.`;
  const frame = twoPart ? await readFile(`${root}/${spec.firstFrame}`) : await sharp(`ref/goods-motion-pilot-v1/frames/${id}.png`)
    .resize(720, 1080)
    .extend({ top: 100, bottom: 100, left: 0, right: 0, extendWith: "mirror" })
    .png()
    .toBuffer();
  const lastFrame = twoPart ? await readFile(`${root}/${spec.lastFrame}`) : frame;
  await writeFile(`${root}/inputs/${id}.png`, frame);
  await writeFile(`${root}/prompts/${id}.txt`, prompt);
  if (!process.argv.includes("--generate")) {
    console.log(JSON.stringify({ id, status: "prepared", paidRequests: 0 }));
    continue;
  }
  const recordPath = `${root}/records/${id}.json`;
  for (const file of [recordPath, `${root}/raw/${id}.mp4`]) {
    try {
      await access(file);
      throw Error(
        `Existing attempt: ${file}. Inspect before an intentional retry.`,
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const record = {
    id,
    ...spec,
    model: "gemini-omni-1.1-flash",
    requestedSeconds: twoPart ? spec.seconds : lumi15 ? 15 : 10,
    resolution: "720p",
    aspectRatio: "9:16",
    finalCrop: "720:1080:0:100",
    requests: 1,
    status: "started",
    startedAt: new Date().toISOString(),
  };
  await writeFile(recordPath, JSON.stringify(record, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ id, status: "request-started", requests: 1 }));
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
            ...(lumiFix || lumi15 || twoPart ? [{ type: "image", data: lastFrame.toString("base64"), mime_type: "image/png" }] : []),
            { type: "text", text: prompt },
          ],
          response_format: {
            type: "video",
            resolution: "720p",
            aspect_ratio: "9:16",
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
      throw Error(sanitize(data.error?.message ?? `HTTP ${response.status}`));
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
        throw Error("Unexpected download host");
      const download = await fetch(url, {
        headers: { "x-goog-api-key": key },
        redirect: "error",
        signal: AbortSignal.timeout(60000),
      });
      if (!download.ok) throw Error(`Download failed: ${download.status}`);
      bytes = Buffer.from(await download.arrayBuffer());
    } else throw Error("No video returned");
    await writeFile(`${root}/raw/${id}.mp4`, bytes, { flag: "wx" });
    Object.assign(record, {
      status: "completed",
      finishedAt: new Date().toISOString(),
      bytes: bytes.length,
      usage: data.usage,
    });
    console.log(
      JSON.stringify({ id, status: record.status, bytes: bytes.length }),
    );
  } catch (error) {
    Object.assign(record, {
      status: "failed-or-unknown",
      message: sanitize(error.message),
      causeCode: error.cause?.code,
    });
    console.error(
      JSON.stringify({ id, status: record.status, message: record.message }),
    );
    process.exitCode = 1;
  } finally {
    await writeFile(recordPath, JSON.stringify(record, null, 2));
  }
}
