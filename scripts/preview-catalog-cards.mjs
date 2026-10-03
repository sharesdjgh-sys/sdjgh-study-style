import { writeFile } from "node:fs/promises";
import { CHARACTERS, CHARACTER_IMAGES } from "../src/lib/characters.ts";
import { CHARACTER_MOTIONS } from "../src/lib/character-motions.ts";
import { CATALOG_CARD_THEMES } from "../src/lib/catalog-card-themes.ts";

const families = {
  visual: "시각형",
  auditory: "청각형",
  tactile: "촉각형",
  motion: "운동형",
};
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const asset = (path) => `../public${path}`;
const cards = Object.entries(CHARACTERS)
  .map(([code, character]) => {
    const theme = CATALOG_CARD_THEMES[code];
    const motion = CHARACTER_MOTIONS[code];
    const top = `<div class="card-top"><span>공부캐 도감</span><span>No. ${character.number}</span></div>`;
    return `<section class="pair" data-family="${code.split("-")[0]}" style="--ink:${theme.ink};--tint:${theme.tint};--line:${theme.rim};--motion-background:${motion.background}">
    <h2 class="pair-title"><span>${character.number}</span> ${escape(character.name)} <small>${families[code.split("-")[0]]}</small></h2>
    <div class="pair-cards">
      <div class="state silhouette-state"><span class="state-label">미발견 · 실루엣</span>
        <article class="card"><div class="card-top"><span>아직은 비밀</span><span>No. ${character.number}</span></div>
          <div class="portrait silhouette"><span class="orbit"></span><img src="${asset(CHARACTER_IMAGES[code])}" alt="${escape(character.name)} 실루엣" width="768" height="768"><span class="question" aria-hidden="true">?</span></div>
          <h3>${escape(character.name)}</h3><p class="copy">어떤 귀여운 친구가 숨어 있을까?</p><p class="muted">어떤 모습일지, 만나면 알 수 있어요.</p><div class="card-bottom">첫 검사와 친구 초대로 하나씩 만나요</div>
        </article>
      </div>
      <div class="state motion-state"><span class="state-label">발견 후 · 동영상</span>
        <article class="card">${top}
          <div class="portrait"><div class="motion"><video src="${asset(motion.video)}" poster="${asset(motion.poster)}" muted autoplay loop playsinline preload="metadata" aria-label="${escape(character.name)} 움직이는 카드"></video></div></div>
          <span class="family">${families[code.split("-")[0]]} · ${escape(character.species)}</span><h3>${escape(character.name)}</h3><p class="copy">${escape(character.line)}</p><div class="card-bottom">${escape(character.tags.join(" · "))}</div>
        </article>
      </div>
    </div>
  </section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>공부캐 카드 · 실루엣과 동영상 비교</title>
<style>
@font-face{font-family:Pretendard;src:url('../public/fonts/PretendardVariable.woff2') format('woff2');font-weight:45 920;font-display:swap}
@font-face{font-family:Ssurround;src:url('../public/fonts/Cafe24Ssurround-v2.0.woff2') format('woff2');font-weight:700;font-display:swap}
*{box-sizing:border-box}body{margin:0;background:#f7f8f2;color:#243d35;font-family:Pretendard,system-ui,sans-serif}button,select,input{font:inherit}button,select{cursor:pointer}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #79618b;outline-offset:3px}header{max-width:1600px;margin:auto;padding:32px 24px 18px}h1{font-family:Ssurround,sans-serif;font-size:30px;margin:0 0 10px}header p{font-size:14px;line-height:1.7;color:#61746c;margin:0}.controls{position:sticky;top:0;z-index:10;background:#f7f8f2f5;border-block:1px solid #d9e2d9;backdrop-filter:blur(12px)}.toolbar{max-width:1600px;margin:auto;padding:12px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}.modes{display:flex;gap:6px}.modes button,select,#playback{border:1px solid #cdd8ca;border-radius:10px;padding:9px 12px;background:#fff;color:#365549}.modes button[aria-pressed=true]{background:#27785d;color:#fff;border-color:#27785d}.size-label{display:flex;gap:8px;align-items:center;font-size:13px}.size-label input{width:90px;accent-color:#27785d}#status{font-size:12px;color:#61746c}.grid{--pair-width:330px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--pair-width)),1fr));gap:24px 18px;max-width:1600px;margin:0 auto;padding:24px}.pair-title{font-size:18px;font-family:Ssurround,sans-serif;color:var(--ink);margin:0 0 10px;display:flex;align-items:center;gap:8px}.pair-title>span{font:12px Pretendard,sans-serif;opacity:.7}.pair-title small{font:12px Pretendard,sans-serif;margin-left:auto}.pair-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.state{display:flex;flex-direction:column;min-width:0}.state-label{font-size:11px;color:#61746c;margin-bottom:7px}.card{display:flex;flex-direction:column;flex:1;min-width:0;padding:14px 10px 12px;border:1px solid color-mix(in srgb,var(--line) 35%,white);border-radius:19px;background:radial-gradient(ellipse at 50% 35%,#fffefa 0%,var(--tint) 62%,#fffefa 100%);box-shadow:0 10px 20px -17px #26352670;text-align:center}.card-top{display:flex;justify-content:space-between;gap:6px;font-size:9px;color:var(--ink)}.portrait{position:relative;display:grid;place-items:center;aspect-ratio:1;margin:8px -3px 10px}.portrait>img{width:100%;height:100%;object-fit:contain;position:relative}.silhouette>img{filter:brightness(0);opacity:.76}.orbit{position:absolute;width:89%;aspect-ratio:1;border:1px dashed color-mix(in srgb,var(--line) 40%,white);border-radius:50%;background:#ffffff50}.question{position:absolute;left:50%;top:43%;transform:translate(-50%,-50%) rotate(-8deg);font:700 46px Ssurround,sans-serif;color:#fff7df;text-shadow:0 4px 20px #15132255}.motion{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:var(--motion-background)}video{display:block;width:100%;height:100%;object-fit:contain}.family{font-size:10px;color:var(--ink);margin-bottom:3px}h3{font:700 clamp(25px,2.3vw,36px)/1.2 Ssurround,sans-serif;color:var(--ink);margin:5px 0 10px;letter-spacing:-.025em}.copy{font-size:12px;line-height:1.65;margin:0 0 7px;word-break:keep-all}.muted{font-size:10px;line-height:1.7;color:#61746c;margin:0 0 12px}.card-bottom{margin-top:auto;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--line) 25%,white);font-size:10px;color:#61746c;line-height:1.6;word-break:keep-all}.pair[hidden]{display:none}.grid[data-view=silhouette] .motion-state,.grid[data-view=motion] .silhouette-state{display:none}.grid:not([data-view=compare]) .pair-cards{grid-template-columns:1fr}.grid:not([data-view=compare]){grid-template-columns:repeat(auto-fit,minmax(min(100%,calc(var(--pair-width) * .62)),1fr))}.grid:not([data-view=compare]) .portrait{max-height:300px;width:100%;margin-inline:auto}.grid:not([data-view=compare]) .card{padding:18px}.play-error{position:absolute;bottom:5px;font-size:10px;background:#fff8;padding:4px;border-radius:5px}footer{padding:0 24px 32px;color:#61746c;text-align:center;font-size:12px;line-height:1.8}@media(max-width:600px){header{padding:22px 16px 14px}h1{font-size:24px}.toolbar{padding:10px 16px;gap:8px}.modes button,select,#playback{padding:8px;font-size:12px}.size-label{display:none}.grid{padding:18px 16px;gap:24px}.grid:not([data-view=compare]){grid-template-columns:repeat(2,minmax(0,1fr))}.grid:not([data-view=compare]) .card{padding:12px 8px}h3{font-size:29px}}@media(prefers-reduced-motion:reduce){.controls{backdrop-filter:none}}
</style></head><body>
<header><h1>공부캐 카드, 한눈에 비교하기</h1><p>기존 카드 모양 그대로. 한글 이름과 배경만 캐릭터별 색상으로 맞췄어요.<br>왼쪽은 실루엣과 ?, 오른쪽은 움직이는 카드예요.</p></header>
<div class="controls"><div class="toolbar"><div class="modes" aria-label="카드 보기 방식"><button data-view="compare" aria-pressed="true">나란히 비교</button><button data-view="silhouette" aria-pressed="false">실루엣만</button><button data-view="motion" aria-pressed="false">동영상만</button></div><select id="family" aria-label="공부 유형"><option value="all">전체 16명</option value="visual">시각형</option><option value="auditory">청각형</option><option value="tactile">촉각형</option><option value="motion">운동형</option></select><button id="playback" aria-pressed="false">영상 일시정지</button><label class="size-label">카드 크기 <input id="size" type="range" min="280" max="650" value="330"></label><span id="status" role="status"></span></div></div>
<main class="grid" data-view="compare">${cards}</main>
<footer>영상은 무음으로 반복 재생됩니다. 프로젝트 폴더 안에서 이 HTML을 열면 함께 있는 이미지와 영상을 불러옵니다.</footer>
<script>
const grid=document.querySelector('.grid');const videos=[...document.querySelectorAll('video')];let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const playback=document.querySelector('#playback');
function syncPlayback(){playback.textContent=paused?'영상 재생':'영상 일시정지';playback.setAttribute('aria-pressed',String(paused));videos.forEach(v=>{const rect=v.getBoundingClientRect();const visible=!!v.getClientRects().length&&rect.top<innerHeight&&rect.bottom>0;if(!paused&&visible&&!document.hidden)v.play().catch(()=>{});else v.pause();});}
function status(){const count=[...document.querySelectorAll('.pair')].filter(p=>!p.hidden).length;document.querySelector('#status').textContent=count+'명 표시 중';}
document.querySelectorAll('.modes button').forEach(b=>b.addEventListener('click',()=>{grid.dataset.view=b.dataset.view;document.querySelectorAll('.modes button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));syncPlayback();status();}));
document.querySelector('#family').addEventListener('change',e=>{document.querySelectorAll('.pair').forEach(p=>p.hidden=e.target.value!=='all'&&p.dataset.family!==e.target.value);syncPlayback();status();});
playback.addEventListener('click',()=>{paused=!paused;syncPlayback();});document.querySelector('#size').addEventListener('input',e=>grid.style.setProperty('--pair-width',e.target.value+'px'));
const observer=new IntersectionObserver(syncPlayback,{threshold:0});videos.forEach(v=>observer.observe(v));document.addEventListener('visibilitychange',syncPlayback);syncPlayback();status();
</script></body></html>`;
await writeFile(
  new URL("../art/catalog-cards-preview.html", import.meta.url),
  html,
  "utf8",
);
console.log("Created art/catalog-cards-preview.html (16 characters, 32 cards)");
