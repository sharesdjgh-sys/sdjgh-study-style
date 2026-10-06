import { readFile, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
const assets = JSON.parse(
  await readFile("art/skills/generated-assets.json", "utf8"),
);
await mkdir("public/skills", { recursive: true });
for (const asset of assets) {
  await sharp(asset.source)
    .trim()
    .resize(
      asset.id.startsWith("lock-") || asset.id === "heart" ? 256 : 960,
      undefined,
      { withoutEnlargement: true },
    )
    .webp({ quality: 86 })
    .toFile(`public/skills/${asset.id}.webp`);
}
await writeFile(
  "art/skills/README.md",
  "Generated using the built-in image_gen tool. Prompts and source image paths are recorded in generated-assets.json. Final web assets are in public/skills. Original character art remains unchanged.\n",
);
