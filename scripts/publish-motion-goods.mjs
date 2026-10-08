import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = JSON.parse(
  await readFile("ref/goods-motion-series/manifest.json", "utf8"),
).cards;
const active = JSON.parse(
  await readFile("ref/goods-motion-active-five/manifest.json", "utf8"),
).cards;
const tori = JSON.parse(
  await readFile("ref/goods-motion-tori-result/manifest.json", "utf8"),
).cards[0];
const existing = JSON.parse(
  await readFile("src/lib/goods-catalog.json", "utf8"),
);
await mkdir("art/goods-motion", { recursive: true });
const cards = [];
for (const original of base) {
  const revision = active.find((c) => c.id === original.id);
  const card = original.id === "tori" ? tori : (revision ?? original);
  const root =
    original.id === "tori"
      ? "ref/goods-motion-tori-result"
      : revision
        ? "ref/goods-motion-active-five"
        : "ref/goods-motion-series";
  const code = card.code ?? existing.find((c) => c.name === card.name)?.code;
  if (!code) throw Error(`Unknown character ${card.id}`);
  const id = `${code}--motion-01`;
  const poster = await readFile(`${root}/posters/${card.id}-start.webp`);
  await copyFile(`${root}/videos/${card.id}.mp4`, `art/goods-motion/${id}.mp4`);
  await writeFile(`public/goods/${id}.webp`, poster);
  await writeFile(`art/goods/${id}.webp`, poster);
  cards.push({
    id,
    code,
    name: card.name,
    kind: "motion",
    theme: "motion-01",
    title: card.title,
    imageVersion: createHash("sha256")
      .update(poster)
      .digest("hex")
      .slice(0, 12),
    video: `/api/goods/video?id=${id}`,
    back: {
      story: `${card.name}의 특별한 순간. ${card.focus} 속에 나만의 공부 리듬이 담겨 있어요.`,
      quote: `${card.title}, 우리 함께 만들어 가요.`,
      signature: card.name,
      edition: "스페셜 모션 01",
    },
  });
}
await writeFile(
  "src/lib/goods-motion-catalog.json",
  JSON.stringify(cards, null, 2) + "\n",
);
console.log(`Published ${cards.length} protected motion videos and posters`);
