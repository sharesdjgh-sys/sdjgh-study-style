import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { stories } from "./goods-stories-v2.mjs";
const manifest = JSON.parse(
  await readFile("ref/goods-collection-v2/manifest.json", "utf8"),
);
const previous = JSON.parse(
  await readFile("src/lib/goods-catalog.json", "utf8"),
);
if (
  manifest.completed !== 128 ||
  manifest.items.length !== 128 ||
  stories.length !== 128
)
  throw Error("Expected 128 complete approved cards and stories");
const ids = new Set(manifest.items.map((i) => i.id));
if (ids.size !== 128 || previous.some((i) => !ids.has(i.id)))
  throw Error("Existing ownership IDs must be preserved");
if (manifest.items.some((i, index) => i.id !== previous[index]?.id))
  throw Error("Card order must match the curated story order");
if (
  stories.some((i) => !i.story || !i.quote) ||
  new Set(stories.map((i) => i.quote)).size !== 128
)
  throw Error("Each approved card needs its own story and quote");
// Validate every source before replacing any service asset.
await Promise.all(manifest.items.map((i) => access(`ref/${i.original}`)));
await mkdir("public/goods", { recursive: true });
await mkdir("art/goods", { recursive: true });
const items = [];
for (const [index, i] of manifest.items.entries()) {
  const source = await readFile(`ref/${i.original}`);
  await sharp(source)
    .resize(384, 576, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(`public/goods/${i.id}.webp`);
  await sharp(source)
    .resize(1024, 1536, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(`art/goods/${i.id}.webp`);
  items.push({
    id: i.id,
    code: i.code,
    name: i.name,
    kind: i.kind,
    theme: `${i.kind}-${String(i.number).padStart(2, "0")}`,
    title: i.title,
    imageVersion: createHash("sha256")
      .update(source)
      .digest("hex")
      .slice(0, 12),
    back: {
      ...stories[index],
      signature: i.name,
      edition: `${i.kind === "daily" ? "일상 기록" : "특별 의상"} ${String(i.number).padStart(2, "0")}`,
    },
  });
}
await writeFile(
  "src/lib/goods-catalog.json",
  JSON.stringify(items, null, 2) + "\n",
);
console.log(`Prepared ${items.length} goods cards`);
