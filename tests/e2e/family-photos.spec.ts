import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  EMPTY_COLLECTION,
  type CollectionData,
} from "../../src/lib/collection-contract";
import { STUDY_TYPES } from "../../src/lib/content";

test("유형 네 명 수집 후 사진 해제·확대·저장과 유형 필터", async ({ page }) => {
  let data: CollectionData = {
    ...EMPTY_COLLECTION,
    configured: true,
    signedIn: true,
    cards: STUDY_TYPES.filter((t) => t.modality === "visual")
      .slice(0, 3)
      .map((t) => ({ code: t.code, source: "referral" })),
    pending: [{ id: "pending-fourth" }],
  };
  await page.route("**/api/collection", (route) =>
    route.fulfill({ json: data }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  let requests = 0;
  await page.route("**/api/collection/special-card*", async (route) => {
    requests++;
    const url = new URL(route.request().url());
    expect(url.searchParams.get("family")).toBe("visual");
    const download = url.searchParams.get("download") === "1";
    const video = url.searchParams.get("format") === "mp4";
    await route.fulfill({
      body: await readFile(
        video
          ? "art/characters/special/families/visual-loop-8s-v1.mp4"
          : `art/characters/special/families/visual.${download ? "png" : "webp"}`,
      ),
      contentType: video ? "video/mp4" : download ? "image/png" : "image/webp",
      headers: download
        ? {
            "Content-Disposition":
              'attachment; filename="gongbucae-visual.png"',
          }
        : {},
    });
  });
  await page.goto("/types");
  await expect(page.locator(".family-collection-card")).toHaveCount(0);
  await expect(page.locator(".special-collection-card")).toHaveCount(1);
  await page.getByRole("button", { name: "시각형", exact: true }).click();
  await expect(
    page.locator(".character-gallery > .family-collection-card"),
  ).toHaveCount(1);
  await expect(page.locator(".special-collection-card")).toHaveCount(0);
  const photo = page.getByRole("region", {
    name: "시각형 완성 단체사진",
    exact: true,
  });
  await expect(photo).toContainText("3 / 4");
  await expect(photo.locator(".group-photo-silhouette img")).toHaveCount(4);
  await expect(photo.locator(".special-photo-frame")).toHaveCount(0);
  expect(requests).toBe(0);
  data = {
    ...data,
    cards: STUDY_TYPES.filter((t) => t.modality === "visual").map((t) => ({
      code: t.code,
      source: "referral",
    })),
    pending: [],
  };
  await page.reload();
  await page.getByRole("button", { name: "시각형", exact: true }).click();
  await expect(photo).toContainText("단체사진 획득 완료");
  await photo.scrollIntoViewIfNeeded();
  await expect(photo.locator("img")).toBeVisible();
  await expect
    .poll(() =>
      photo
        .locator("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(1664);
  const opener = photo.getByRole("button", { name: "단체사진 크게 보기" });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("시각형 친구들, 다 모였다!");
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("link", { name: "단체사진 저장하기" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.png$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.getByRole("button", { name: "청각형", exact: true }).click();
  await expect(page.locator(".family-collection-card")).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "청각형 완성 단체사진", exact: true }),
  ).toContainText("0 / 4");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  data = { ...data, signedIn: false };
  await page.reload();
  await expect(page.locator(".family-collection-card img")).toHaveCount(0);
});
