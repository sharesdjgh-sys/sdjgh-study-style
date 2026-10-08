import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const loopV2 = process.argv.includes("--loop-v2");
const root = loopV2 ? "ref/goods-motion-pilot-v2" : "ref/goods-motion-pilot-v1";
const names = { lumi: "루미", melo: "멜로", block: "블록" };
const run = (command, args) =>
  execFileSync(command, args, {
    windowsHide: true,
    stdio: "pipe",
    maxBuffer: 8 * 1024 * 1024,
  });
const probe = (file) =>
  JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate",
      "-of",
      "json",
      file,
    ]),
  );
await mkdir(`${root}/videos`, { recursive: true });
await mkdir(`${root}/posters`, { recursive: true });
await mkdir(`${root}/review`, { recursive: true });
const cards = [];
for (const id of Object.keys(names)) {
  const record = JSON.parse(
    await readFile(`${root}/records/${id}.json`, "utf8"),
  );
  if (record.status !== "completed")
    throw Error(`${id}: video generation not completed`);
  const source = `${root}/raw/${id}.mp4`;
  const original = probe(source);
  const stream = original.streams.find((s) => s.codec_type === "video");
  if (Math.abs(stream.width / stream.height - 9 / 16) > 0.01)
    throw Error(`${id}: unexpected aspect ratio`);
  const duration = Number(original.format.duration);
  if (duration < 8 || duration > 12.1)
    throw Error(`${id}: duration outside 8–12 seconds`);
  const video = `${root}/videos/${id}.mp4`;
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    source,
    "-vf",
    "scale=720:-2,crop=720:1080:0:(ih-1080)/2",
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
  run("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"]);
  const metadata = probe(video);
  const resultStream = metadata.streams.find((s) => s.codec_type === "video");
  if (
    resultStream.width !== 720 ||
    resultStream.height !== 1080 ||
    metadata.streams.some((s) => s.codec_type === "audio")
  )
    throw Error(`${id}: invalid final format`);
  for (const [label, time] of [
    ["start", id === "block" ? 0 : 1],
    ["end", Math.max(0, duration - 0.15)],
  ]) {
    const frame = `${root}/review/${id}-${label}.png`;
    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-ss",
      String(time),
      "-i",
      video,
      "-frames:v",
      "1",
      "-update",
      "1",
      frame,
    ]);
    await sharp(frame)
      .webp({ quality: 92 })
      .toFile(`${root}/posters/${id}-${label}.webp`);
  }
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    video,
    "-vf",
    "fps=1,scale=216:324,tile=5x2:padding=4:margin=4:color=0xeee8db",
    "-frames:v",
    "1",
    "-update",
    "1",
    `${root}/review/${id}-contact.jpg`,
  ]);
  cards.push({
    id,
    name: names[id],
    title: loopV2 && id === "block" ? "함께 맞추는 다음 한 조각" : record.title,
    code: record.code,
    video: `videos/${id}.mp4`,
    poster: `posters/${id}-start.webp`,
    ending: `posters/${id}-end.webp`,
    contact: `review/${id}-contact.jpg`,
    duration: Number(metadata.format.duration),
    width: 720,
    height: 1080,
    bytes: Number(metadata.format.size),
    model: record.model,
    requests: record.requests,
    silent: true,
  });
  console.log(JSON.stringify(cards.at(-1)));
}
const manifest = {
  status: "pilot-review",
  createdAt: new Date().toISOString(),
  cards,
};
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2));
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const body = cards
  .map(
    (c) =>
      `<article id="${c.id}"><div class="screen"><video id="video-${c.id}" controls playsinline muted preload="metadata" poster="${c.poster}" aria-label="${esc(c.name)} ${esc(c.title)} 시범 영상"><source src="${c.video}" type="video/mp4">동영상을 지원하지 않는 브라우저입니다. 아래 다운로드 링크를 사용해 주세요.</video><div class="transport"><button data-replay="${c.id}">처음부터 재생</button><label>속도 <select data-speed="${c.id}"><option value="1">1배속</option><option value="0.5">0.5배속</option></select></label><label class="loop-toggle"><input type="checkbox" data-loop="${c.id}"> 반복 재생</label><button data-boundary="${c.id}">끝→처음 연결 보기</button></div><p class="loop-help">반복 재생을 켜거나 ‘끝→처음 연결 보기’를 누르면 마지막 2초부터 반복됩니다. 현재 영상은 결말에서 멈추는 시범작으로, 매끄럽게 이어지는 루프 영상은 아닙니다.</p></div><div class="copy">${c.id === "lumi" ? "<p class=\"defect\">수정 필요 · 초반 약 0.5~2초에 자가 두 갈래로 변형됩니다. 현재는 결함 확인용 원본입니다.</p>" : ""}<span class="tag">${esc(c.name)} · ${c.duration.toFixed(1)}초 · 720 × 1080 · ${(c.bytes / 1048576).toFixed(1)}MB</span><h2>${esc(c.title)}</h2><p>${{ lumi: "마지막 별길을 잇고, 완성된 별자리를 바라보는 루미.", melo: "코코아의 김에서 떠오른 질문이 작은 상상으로 이어지는 멜로.", block: "블록이 받치고 토리가 연결해, 함께 만든 길을 확인하는 장면." }[c.id]}</p><p class="notice">시범 영상 · 서비스 미반영 · 별 차감 없음</p><p><a href="${c.video}" download="StudyCrew-${c.id}-pilot-v1.mp4">영상 다운로드</a> · <a href="${c.ending}" target="_blank" rel="noopener">마지막 장면</a></p><details><summary>1초 간격으로 장면 확인</summary><p>왼쪽 위부터 오른쪽으로 0~9초 순서입니다.</p><a href="${c.contact}" target="_blank" rel="noopener"><img loading="lazy" src="${c.contact}" alt="${esc(c.name)} 영상의 1초 간격 장면 10개"></a></details><label class="review">검토 메모<textarea data-note="${c.id}" placeholder="표정, 손, 소품, 움직임에서 수정하고 싶은 점"></textarea></label><small>메모는 이 브라우저에만 저장됩니다.</small></div></article>`,
  )
  .join("");
await writeFile(
  `${root}/index.html`,
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>움직이는 스페셜 카드 · 시범 3종</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f1e7;color:#35453d;font:15px/1.8 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:44px 24px 80px}header{margin-bottom:28px}h1{font-size:clamp(27px,4vw,40px);line-height:1.4;letter-spacing:-.04em;margin:10px 0}header p{max-width:800px;color:#746c60}mark{background:linear-gradient(transparent 60%,#ead78f 60% 94%,transparent 94%);color:inherit}.eyebrow,.tag{color:#8a6b43;font-size:12px;font-weight:700}nav{display:flex;gap:12px;margin:20px 0}nav a{padding:8px 18px;background:#eee3f3;border-radius:22px;text-decoration:none}article{display:grid;grid-template-columns:minmax(240px,360px) 1fr;gap:32px;background:#fffdf8;border:1px solid #dbd0bd;border-radius:22px;padding:26px;margin:24px 0;scroll-margin-top:24px}video{width:100%;aspect-ratio:2/3;display:block;border-radius:12px;background:#20212d;box-shadow:0 10px 28px #54452c25}h2{font-size:27px;line-height:1.4;letter-spacing:-.03em;margin:14px 0}.notice{display:inline-block;background:#f1ead7;color:#80643c;border-radius:10px;padding:6px 12px;font-size:12px}a{color:#79538b}button,select{font:inherit;border:1px solid #d1c2b4;border-radius:10px;padding:8px 12px;background:#fffaf0;color:#725283;cursor:pointer}.transport{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:12px;font-size:12px}details{margin:20px 0}summary{font-weight:700;cursor:pointer}details img{width:100%;border-radius:8px}details p{font-size:12px;color:#847461}.review{display:block;font-size:13px;font-weight:700;margin-top:24px}textarea{display:block;width:100%;min-height:108px;font:inherit;resize:vertical;border:1px solid #d6ccbc;border-radius:12px;background:#faf7ef;padding:12px;color:#35453d;margin-top:6px}small,footer{font-size:12px;color:#847862}a:focus-visible,button:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #a184b2;outline-offset:3px}@media(max-width:700px){main{padding:24px 16px 65px}article{grid-template-columns:1fr;padding:18px;gap:18px}h2{font-size:23px}.screen{max-width:360px;width:100%;margin:auto}}.transport{flex-wrap:wrap;justify-content:flex-start}.loop-toggle{display:flex;align-items:center;gap:5px;padding:8px}.loop-toggle input{accent-color:#79538b}.loop-help{font-size:12px;color:#746c60;margin:10px 0}.defect{padding:10px 12px;border-left:3px solid #ba8044;background:#fff2dc;font-size:13px}input:focus-visible{outline:3px solid #a184b2;outline-offset:3px}</style></head><body><main><header><span class="eyebrow">STUDYCREW · MOTION CARD PILOT V1</span><h1>세 친구의 이야기가<br><mark>움직이기 시작했어요.</mark></h1><p>루미·멜로·블록의 10초 시범 영상입니다. 재생 버튼으로 확인하고, 손과 소품의 움직임은 0.5배속 또는 1초 간격 장면으로 살펴볼 수 있습니다.</p><nav aria-label="캐릭터 선택">${cards.map((c) => `<a href="#${c.id}">${c.name}</a>`).join("")}</nav></header>${body}<footer>원본 영상과 생성 기록은 별도로 보존했습니다. 자동 반복 재생은 꺼져 있으며, 실제 굿즈 카탈로그와 소장 내역은 변경하지 않았습니다.</footer></main><script>document.querySelectorAll('[data-loop]').forEach(t=>t.addEventListener('change',()=>{document.getElementById('video-'+t.dataset.loop).loop=t.checked;}));document.querySelectorAll('[data-boundary]').forEach(b=>b.addEventListener('click',async()=>{const v=document.getElementById('video-'+b.dataset.boundary);if(v.readyState<1){v.load();await new Promise(resolve=>v.addEventListener('loadedmetadata',resolve,{once:true}));}v.loop=true;document.querySelector('[data-loop="'+b.dataset.boundary+'"]').checked=true;v.currentTime=Math.max(0,v.duration-2);v.play().catch(()=>{});}));document.querySelectorAll('[data-replay]').forEach(b=>b.addEventListener('click',()=>{const v=document.getElementById('video-'+b.dataset.replay);v.currentTime=0;v.play().catch(()=>{});}));document.querySelectorAll('[data-speed]').forEach(s=>s.addEventListener('change',()=>{document.getElementById('video-'+s.dataset.speed).playbackRate=Number(s.value);}));document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==v)other.pause();});}));document.querySelectorAll('[data-note]').forEach(t=>{const key='studycrew-motion-pilot-v1-'+t.dataset.note;try{t.value=localStorage.getItem(key)||'';}catch{}t.addEventListener('input',()=>{try{localStorage.setItem(key,t.value);}catch{}});});</script></body></html>`,
);
if (loopV2) {
  let html = await readFile(`${root}/index.html`, "utf8");
  html = html
    .replaceAll("PILOT V1", "LOOP PILOT V2")
    .replaceAll("pilot-v1", "pilot-v2")
    .replaceAll('<video id=', '<video loop id=')
    .replaceAll('type="checkbox" data-loop=', 'type="checkbox" checked data-loop=')
    .replace(/<p class="defect">[\s\S]*?<\/p>/g, "")
    .replace('<div class="copy"><span', '<div class="copy"><p class="defect">루미 재제작본 · 자 분리 문제는 확인한 구간에서 사라졌습니다. 다만 끝→처음에 얼굴 각도와 배경 차이가 남아 있어 추가 수정이 필요합니다.</p><span')
    .replaceAll('반복 재생을 켜거나 ‘끝→처음 연결 보기’를 누르면 마지막 2초부터 반복됩니다. 현재 영상은 결말에서 멈추는 시범작으로, 매끄럽게 이어지는 루프 영상은 아닙니다.', '새로 생성한 루프 영상입니다. ‘끝→처음 연결 보기’로 마지막 2초부터 이어지는 동작을 확인할 수 있습니다. 반복 재생은 기본으로 켜져 있습니다.')
    .replace('자동 반복 재생은 꺼져 있으며,', '반복 재생은 기본으로 켜져 있으며,')
    .replace('마지막 별길을 잇고, 완성된 별자리를 바라보는 루미.', '한 개의 자를 고정한 채, 떠오른 별자리가 별지도에 돌아오는 순간을 바라보는 루미.')
    .replace('블록이 받치고 토리가 연결해, 함께 만든 길을 확인하는 장면.', '소품을 그대로 유지하며, 함께 다음 조각을 맞추기 전 눈빛을 나누는 블록과 토리.')
    .replace('네 조각까지, 이제 완성', '함께 맞추는 다음 한 조각')
    .replace('</header>', '<p><a href="/v1/index.html">이전 시범작 보기</a></p></header>');
  await writeFile(`${root}/index.html`, html);
}
