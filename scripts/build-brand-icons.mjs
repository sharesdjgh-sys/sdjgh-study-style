import sharp from "sharp";
import { fileURLToPath } from "node:url";

// Keep the generated master intact; derive browser and installation sizes locally.
const source = new URL(
  "../public/brand/study-friends-v2-master.png",
  import.meta.url,
);
const output = (path) => fileURLToPath(new URL(path, import.meta.url));
const input = fileURLToPath(source);
for (const size of [192, 512]) {
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(output(`../public/brand/study-friends-v2-${size}.png`));
}
// The entire square artwork fits inside the central 80%-diameter safe circle.
await sharp(input)
  .resize(288, 288)
  .extend({
    top: 112,
    bottom: 112,
    left: 112,
    right: 112,
    background: "#f7f8f2",
  })
  .png()
  .toFile(output("../public/brand/study-friends-v2-maskable-512.png"));
await sharp(input)
  .resize(180, 180)
  .png()
  .toFile(output("../src/app/apple-icon.png"));
await sharp(input).resize(64, 64).png().toFile(output("../src/app/icon.png"));
console.log(`Built app icons from ${source.pathname}`);
