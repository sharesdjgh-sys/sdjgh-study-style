import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { artRoot, workRoot, specs } from "./character-video-common.mjs";

const characters = [
  {
    code: "visual-solo-planned",
    name: "루미",
    action: "개념 지도를 바라보며 고개를 끄덕이고 조용히 생각해요.",
  },
  ...specs.map((s) =>
    s.code === "auditory-solo-flexible"
      ? {
          ...s,
          action: "헤드폰에 귀 기울이며 고개와 꼬리를 부드럽게 움직여요.",
        }
      : s,
  ),
];
const records = await Promise.all(
  characters.map((c) =>
    readFile(`${artRoot}/eight-second-delivery/${c.code}.json`, "utf8").then(
      JSON.parse,
    ),
  ),
);
for (const record of records) {
  const stream = record.delivery.streams.find((s) => s.codec_type === "video");
  if (
    Number(record.delivery.format.duration) !== 8 ||
    Number(stream.nb_frames) !== 192 ||
    stream.width !== 720 ||
    stream.height !== 720 ||
    stream.r_frame_rate !== "24/1" ||
    record.delivery.streams.some((s) => s.codec_type === "audio")
  )
    throw new Error(`${record.code}: unexpected format`);
  if (
    (await stat(record.video)).size !== Number(record.delivery.format.size) ||
    !(await stat(record.poster)).size
  )
    throw new Error(`${record.code}: missing or changed delivery file`);
}
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const cards = characters
  .map(
    (c, i) => `<article>
<video controls muted loop playsinline preload="none" poster="../../${records[i].poster}" aria-label="${escape(c.name)} 8초 반복 영상">
<source src="../../${records[i].video}" type="video/mp4"></video>
<div class="copy"><span>${String(i + 1).padStart(2, "0")} / 16</span><h2>${escape(c.name)}</h2><p>${escape(c.action)}</p><a href="../../${records[i].video}" download>영상 다운로드</a></div></article>`,
  )
  .join("\n");
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>공부캐 · 16명의 움직임</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f6f1;color:#292e27;font-family:system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:60px 28px}header{margin-bottom:32px}header p{color:#61685c;line-height:1.8}h1{font-size:clamp(28px,4vw,48px);margin:8px 0;letter-spacing:-2px}.eyebrow{font-size:13px;letter-spacing:2px;color:#707d61}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}article{border:1px solid #e0e2d9;background:white;border-radius:24px;overflow:hidden;box-shadow:0 12px 32px #26321a08}video{display:block;width:100%;height:auto;aspect-ratio:1;background:#f2f4ec}.copy{padding:20px 22px 24px}.copy span{font-size:12px;color:#849078}h2{margin:6px 0;font-size:25px}.copy p{line-height:1.65;font-size:14px;min-height:48px;color:#646a5e}.copy a{font-size:13px;color:#536544;text-underline-offset:4px}footer{margin-top:32px;color:#68725f;font-size:14px}@media(max-width:1050px){.grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:760px){.grid{grid-template-columns:repeat(2,1fr)}main{padding:32px 16px}.copy{padding:16px}}@media(max-width:430px){.grid{grid-template-columns:1fr}}
</style><main><header><div class="eyebrow">GONGBU CHARACTER COLLECTION</div><h1>16명, 저마다의 공부 리듬.</h1><p>화면에 보이는 영상을 8초마다 반복 재생합니다. 멈춤·재생을 직접 조절할 수 있어요.</p></header><div class="grid">${cards}</div><footer>공부캐는 다양한 공부법과 공부 스타일을 알아보는 재미있는 캐릭터 테스트입니다.</footer></main>
<script>
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const manuallyPaused = new WeakSet();
const visible = new WeakSet();
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('pause', () => { if(visible.has(video) && !document.hidden) manuallyPaused.add(video); });
  video.addEventListener('play', () => manuallyPaused.delete(video));
});
const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
  if(isIntersecting){visible.add(target);if(!reduced.matches&&!manuallyPaused.has(target)&&!document.hidden)target.play().catch(()=>{});}
  else{visible.delete(target);target.pause();}
}),{threshold:0.2});
document.querySelectorAll('video').forEach(video=>observer.observe(video));
document.addEventListener('visibilitychange',()=>document.querySelectorAll('video').forEach(video=>{
  if(document.hidden)video.pause();else if(visible.has(video)&&!reduced.matches&&!manuallyPaused.has(video))video.play().catch(()=>{});
}));
</script></html>`;
await mkdir(workRoot, { recursive: true });
await writeFile(`${workRoot}/review.html`, html);
const summary = {
  characterCount: 16,
  activeVideoCount: 16,
  secondsPerVideo: 8,
  fps: 24,
  resolution: "720x720",
  trimmedExistingVideos: 15,
  additionalPaidRequests: 1,
  additionalEstimatedUSD: records.find(
    (r) => r.code === "auditory-solo-flexible",
  ).estimatedUSD,
  priorGenerationRecord: `${artRoot}/collection-generation.json`,
  correction: "art/characters/melo-anatomy-v2.json",
  videos: records,
};
await writeFile(
  `${artRoot}/collection-eight-second.json`,
  JSON.stringify(summary, null, 2),
);
console.log(
  JSON.stringify({
    review: `${workRoot}/review.html`,
    characterCount: 16,
    seconds: 8,
    additionalPaidRequests: 1,
    additionalEstimatedUSD: summary.additionalEstimatedUSD,
  }),
);
