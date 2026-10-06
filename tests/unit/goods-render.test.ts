import { it, expect } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { renderGoods } from "../../src/lib/goods-render";
import { GOODS } from "../../src/lib/goods";
it("일상·특별 의상 앞뒤 카드를 한국어 제목과 함께 JPG로 렌더링한다", async () => {
  await mkdir(".artifacts/goods", { recursive: true });
  for (const kind of ["daily", "special"])
    for (const back of [false, true]) {
      const card = GOODS.find((c) => c.kind === kind)!;
      const image = await renderGoods(card, back);
      const metadata = await sharp(image).metadata();
      expect(metadata).toMatchObject({
        format: "jpeg",
        width: 1024,
        height: 1536,
      });
      await writeFile(
        `.artifacts/goods/goods-${kind}-${back ? "back" : "front"}.jpg`,
        image,
      );
    }
}, 30000);
