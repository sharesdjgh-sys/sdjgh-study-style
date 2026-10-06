import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
const manifest = JSON.parse(
  await readFile("ref/goods-collection/manifest.json", "utf8"),
);
if (manifest.items.length !== 128) throw Error("Expected 128 approved cards");
await mkdir("public/goods", { recursive: true });
await mkdir("art/goods", { recursive: true });
const items = [];
for (const i of manifest.items) {
  await sharp(`ref/goods-collection/originals/${i.id}.png`)
    .resize(384, 576, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(`public/goods/${i.id}.webp`);
  await sharp(`ref/goods-collection/originals/${i.id}.png`)
    .resize(1024, 1536, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(`art/goods/${i.id}.webp`);
  items.push({
    id: i.id,
    code: i.code,
    name: i.name,
    kind: i.kind,
    theme: i.theme,
    title: i.title,
    back: i.back,
  });
}
await writeFile(
  "src/lib/goods-catalog.json",
  JSON.stringify(items, null, 2) + "\n",
);
console.log(`Prepared ${items.length} goods cards`);
