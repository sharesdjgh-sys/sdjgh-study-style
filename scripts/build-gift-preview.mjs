import fs from "node:fs/promises";
import ts from "typescript";
import sharp from "sharp";
const source = await fs.readFile("src/lib/characters.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { CHARACTERS, CHARACTER_IMAGES } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const cards = await Promise.all(
  Object.entries(CHARACTERS).map(async ([code, c]) => ({
    code,
    name: c.name,
    number: c.number,
    line: c.line,
    family: code.split("-")[0],
    image: `data:image/webp;base64,${(await sharp(`public${CHARACTER_IMAGES[code]}`).resize(320, 320, { fit: "inside" }).webp({ quality: 83 }).toBuffer()).toString("base64")}`,
  })),
);
const template = await fs.readFile(
  "art/rewards/gift-preview.template.html",
  "utf8",
);
const css = await fs.readFile(
  "src/components/reward-reveal.module.css",
  "utf8",
);
await fs.mkdir("ref", { recursive: true });
const giftArt = {
  closed: `data:image/webp;base64,${(await fs.readFile("public/ui-icons/card-pack-v1.webp")).toString("base64")}`,
  poster: `data:image/webp;base64,${(await fs.readFile("public/rewards/card-pack-poster-v1.webp")).toString("base64")}`,
  video: `data:video/mp4;base64,${(await fs.readFile("public/rewards/card-pack-opening-v1.mp4")).toString("base64")}`,
};
const output = template
  .replace(
    "/* REVEAL_LOGIC */",
    ts
      .transpileModule(
        await fs.readFile("src/lib/character-reveal.ts", "utf8"),
        {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        },
      )
      .outputText.replace(/^export /gm, ""),
  )
  .replace("/* APP_STYLES */", css)
  .replace("/* CARD_DATA */", JSON.stringify(cards))
  .replace("/* GIFT_ART */", JSON.stringify(giftArt));
await fs.writeFile("ref/StudyCrew-gift-preview.html", output, "utf8");
console.log(
  JSON.stringify({
    path: "ref/StudyCrew-gift-preview.html",
    cards: cards.length,
    bytes: Buffer.byteLength(output),
  }),
);
