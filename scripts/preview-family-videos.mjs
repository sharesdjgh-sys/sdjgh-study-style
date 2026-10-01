import { mkdir, writeFile } from "node:fs/promises";
const families = {
  visual: "시각형",
  auditory: "청각형",
  tactile: "촉각형",
  motion: "운동형",
};
await mkdir(".artifacts/family-videos", { recursive: true });
await writeFile(
  ".artifacts/family-videos/review.html",
  `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>공부캐 유형별 단체영상</title><style>body{margin:0;padding:32px;background:#f7f8f2;color:#243d35;font-family:system-ui}main{max-width:1280px;margin:auto}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:24px}article{background:white;border-radius:18px;padding:16px}video{width:100%;aspect-ratio:16/9;border-radius:10px}h2{margin:0 0 12px}a{color:inherit}</style><main><h1>함께여서 더 귀여운 네 친구</h1><p>유형별 8초 무음 반복 영상 · 로컬 미리보기</p><section>${Object.entries(
    families,
  )
    .map(
      ([key, label]) =>
        `<article><h2>${label}</h2><video src="../../art/characters/special/families/${key}-loop-8s-v1.mp4" poster="../../art/characters/special/families/${key}.webp" controls muted loop playsinline preload="metadata"></video><p><a href="../../art/characters/special/families/${key}-loop-8s-v1.mp4" download>영상 저장</a></p></article>`,
    )
    .join("")}</section></main></html>`,
);
console.log(".artifacts/family-videos/review.html");
