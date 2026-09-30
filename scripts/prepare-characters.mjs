import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = path.resolve(".artifacts/character-originals");
const destination = path.resolve("public/characters");
await mkdir(path.join(destination, "thumbs"), { recursive: true });
await mkdir(path.join(destination, "share"), { recursive: true });
const files = (await readdir(source)).filter((name) =>
  /^(visual|auditory|tactile|motion)-(solo|team)-(planned|flexible)\.png$/.test(
    name,
  ),
);
if (files.length !== 16)
  throw new Error(`Expected 16 originals, found ${files.length}`);
let bytes = 0;
for (const name of files) {
  const image = sharp(path.join(source, name));
  const metadata = await image.metadata();
  if (!metadata.hasAlpha)
    throw new Error(`${name}: transparent alpha is missing`);
  const output = await image
    .clone()
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(path.join(destination, name.replace(/\.png$/, ".webp")));
  await image
    .clone()
    .resize(192, 192, { fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(destination, "thumbs", name));
  bytes += output.size;
  await image
    .clone()
    .resize(512, 512, { fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(destination, "share", name));
  console.log(`${name}: ${Math.round(output.size / 1024)} KB`);
}
console.log(
  `16 WebP characters: ${(bytes / 1024 / 1024).toFixed(2)} MB, plus PNG thumbnails`,
);
