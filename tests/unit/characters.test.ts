import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { CHARACTERS, characterThumbnail } from "../../src/lib/characters";
import { STUDY_TYPES } from "../../src/lib/content";

describe("배포용 캐릭터 자산", () => {
  it("16개 유형마다 서로 다른 이름과 이미지가 있으며 투명 배경을 유지한다", async () => {
    expect(Object.keys(CHARACTERS).sort()).toEqual(
      STUDY_TYPES.map((type) => type.code).sort(),
    );
    expect(
      new Set(Object.values(CHARACTERS).map((character) => character.name))
        .size,
    ).toBe(16);
    const hashes = new Set<string>();
    for (const type of STUDY_TYPES) {
      const image = await readFile(
        path.join(process.cwd(), "public", type.asset!),
      );
      hashes.add(createHash("sha256").update(image).digest("hex"));
      const metadata = await sharp(image).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBeLessThanOrEqual(768);
      expect(metadata.hasAlpha).toBe(true);
      const thumb = await sharp(
        path.join(process.cwd(), "public", characterThumbnail(type.code)),
      ).metadata();
      expect(thumb.width).toBeLessThanOrEqual(192);
      expect(thumb.hasAlpha).toBe(true);
      const sharing = await sharp(
        path.join(process.cwd(), "public/characters/share", `${type.code}.png`),
      ).metadata();
      expect(sharing.width).toBeLessThanOrEqual(512);
      expect(sharing.hasAlpha).toBe(true);
    }
    expect(hashes.size).toBe(16);
  });
});
