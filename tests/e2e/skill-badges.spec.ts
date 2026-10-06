import { test, expect } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
import {
  METHOD_IDS,
  methodModality,
  SIGNATURE_METHODS,
} from "../../src/lib/methods";
import { CHARACTERS } from "../../src/lib/characters";

test("28개 스킬 유형과 획득한 16개 캐릭터 배지를 표시한다", async ({
  page,
}, info) => {
  await mockSkills(page, { unlocked: [...METHOD_IDS] });
  await page.goto("/methods");
  await expect(page.locator(".skill-tile[data-unlocked=true]")).toHaveCount(28);
  await expect(page.locator(".skill-tile .skill-modality")).toHaveCount(28);
  for (const modality of ["visual", "auditory", "tactile", "motion"]) {
    expect(
      METHOD_IDS.filter((id) => methodModality(id) === modality),
    ).toHaveLength(7);
    await expect(
      page.locator(`.skill-tile .skill-modality[data-modality="${modality}"]`),
    ).toHaveCount(7);
  }
  await expect(page.locator(".skill-tile .signature-badge")).toHaveCount(16);
  await expect(page.locator(".skill-tile .skill-earned-label")).toHaveCount(12);
  for (const code of Object.keys(SIGNATURE_METHODS)) {
    const badge = page.locator(
      `.skill-tile .signature-badge[data-character="${code}"]`,
    );
    await expect(badge).toHaveAttribute(
      "aria-label",
      `${CHARACTERS[code].name} 시그니처 배지 · 획득`,
    );
    await badge.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        badge
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".catalog-group")
    .first()
    .screenshot({ path: info.outputPath("skill-badges-catalog.png") });
  // A visual QA contact sheet uses the actual rendered badge components.
  await page.evaluate(() => {
    const gallery = document.createElement("div");
    gallery.id = "badge-qa";
    gallery.style.cssText =
      "display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px;width:640px;background:#fffaf0;position:absolute;top:0;left:0;z-index:9999";
    document
      .querySelectorAll(".skill-tile .skill-signature-earned")
      .forEach((badge) => gallery.append(badge.cloneNode(true)));
    document.body.append(gallery);
  });
  await page
    .locator("#badge-qa")
    .screenshot({ path: info.outputPath("all-character-badges.png") });
});

test("잠긴 시그니처는 배지가 없고 하트로 획득하면 팝업과 목록에 나타난다", async ({
  page,
}) => {
  const state = await mockSkills(page, { unlocked: [] });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/methods");
  await expect(page.locator(".skill-tile .skill-modality")).toHaveCount(28);
  await expect(page.locator(".signature-badge")).toHaveCount(0);
  await page.locator(".skill-tile", { hasText: "SQ3R" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "하트 3개 사용해 열기" }).click();
  await expect(
    sheet.getByRole("img", { name: "소리 시그니처 배지 · 획득", exact: true }),
  ).toBeVisible();
  await sheet.getByRole("button", { name: "닫기", exact: true }).click();
  const badge = page.locator(".skill-tile .signature-badge");
  await expect(badge).toHaveCount(1);
  await expect(badge).toHaveAttribute(
    "data-character",
    "auditory-solo-planned",
  );
  await page.reload();
  await expect(badge).toHaveCount(1);
  expect(state.progress.balance).toBe(0);
  expect(state.unlocks).toBe(1);
  state.signedIn = false;
  await page.reload();
  await expect(badge).toHaveCount(0);
});
