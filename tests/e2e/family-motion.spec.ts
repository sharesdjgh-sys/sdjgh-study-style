import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { FAMILIES, MODALITIES, STUDY_TYPES } from "../../src/lib/content";

async function setup(page: Page, failVideo = false) {
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        configured: true,
        signedIn: true,
        cards: STUDY_TYPES.map((t) => ({ code: t.code, source: "referral" })),
      },
    }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await page.route("**/api/collection/special-card*", async (route) => {
    const url = new URL(route.request().url());
    const family = url.searchParams.get("family");
    const video = url.searchParams.get("format") === "mp4";
    if (video && failVideo)
      return route.fulfill({ status: 503, json: { error: "unavailable" } });
    if (family && !MODALITIES.some((m) => m === family))
      throw new Error("Unexpected family");
    const download = url.searchParams.get("download") === "1";
    const ext = video ? "mp4" : download ? "png" : "webp";
    const path = `art/characters/special/${family ? `families/${family}${video ? "-loop-8s-v1" : ""}` : "group-photo"}.${ext}`;
    await route.fulfill({
      body: await readFile(path),
      contentType: video ? "video/mp4" : `image/${ext}`,
      headers: download
        ? { "Content-Disposition": `attachment; filename="group.${ext}"` }
        : {},
    });
  });
}

test("네 유형 단체영상은 8초 반복 재생되고 멈춤·확대·저장을 지원한다", async ({
  page,
}) => {
  test.setTimeout(150000);
  await setup(page);
  await page.goto("/types");
  for (const family of MODALITIES) {
    await page
      .getByRole("button", { name: FAMILIES[family].label, exact: true })
      .click();
    const card = page.locator(".family-collection-card");
    const video = card.locator("video");
    await video.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0),
      )
      .toBe(true);
    expect(
      await video.evaluate((v: HTMLVideoElement) => ({
        duration: v.duration,
        muted: v.muted,
        loop: v.loop,
        width: v.videoWidth,
        height: v.videoHeight,
      })),
    ).toEqual({
      duration: 8,
      muted: true,
      loop: true,
      width: 1280,
      height: 720,
    });
    const looped = await video.evaluate(
      (v: HTMLVideoElement) =>
        new Promise<boolean>((resolve) => {
          let last = v.currentTime,
            loops = 0;
          const timer = setInterval(() => {
            if (v.currentTime < last - 0.5) loops++;
            last = v.currentTime;
            if (loops >= 2) {
              clearInterval(timer);
              clearTimeout(timeout);
              resolve(true);
            }
          }, 50);
          const timeout = setTimeout(() => {
            clearInterval(timer);
            resolve(false);
          }, 19000);
        }),
    );
    expect(looped).toBe(true);
    await card.getByRole("button", { name: /움직임 멈추기/ }).click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);
  }
  const card = page.locator(".family-collection-card");
  await card.getByRole("button", { name: "단체사진 크게 보기" }).click();
  const dialog = page.getByRole("dialog");
  await expect
    .poll(() =>
      dialog.locator("video").evaluate((v: HTMLVideoElement) => !v.paused),
    )
    .toBe(true);
  const saved = page.waitForEvent("download");
  await dialog.getByRole("link", { name: "8초 영상 저장하기" }).click();
  expect((await saved).suggestedFilename()).toMatch(/\.mp4$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("단체영상은 동작 줄이기에서 수동 재생하고 실패 시 사진을 유지한다", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, true);
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("format=mp4")) requests.push(r.url());
  });
  await page.goto("/types");
  await page.getByRole("button", { name: "시각형", exact: true }).click();
  const card = page.locator(".family-collection-card");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("video")).not.toHaveAttribute("src");
  expect(requests).toEqual([]);
  await card.getByRole("button", { name: /움직임 재생/ }).click();
  await expect(card.locator(".character-motion-toggle")).toHaveCount(0);
  await expect(card.locator("img")).toBeVisible();
  await expect(card.locator("video")).not.toHaveAttribute("src");
  expect(requests.length).toBeGreaterThan(0);
});
