import { expect, it } from "vitest";
import { access } from "node:fs/promises";
import { GOODS } from "../../src/lib/goods";
import { CHARACTERS } from "../../src/lib/characters";
it("16명 모두 일상 3장·특별 의상 5장과 고유한 뒷면을 갖는다", async () => {
  expect(GOODS).toHaveLength(128);
  for (const code of Object.keys(CHARACTERS)) {
    expect(
      GOODS.filter((c) => c.code === code && c.kind === "daily"),
    ).toHaveLength(3);
    expect(
      GOODS.filter((c) => c.code === code && c.kind === "special"),
    ).toHaveLength(5);
  }
  for (const field of ["id", "story", "quote"] as const) {
    const values = GOODS.map((c) => (field === "id" ? c.id : c.back[field]));
    expect(new Set(values).size).toBe(128);
    expect(values.every(Boolean)).toBe(true);
  }
  await Promise.all(
    GOODS.map(async (c) => {
      await access(`public/goods/${c.id}.webp`);
      await access(`art/goods/${c.id}.webp`);
    }),
  );
});
