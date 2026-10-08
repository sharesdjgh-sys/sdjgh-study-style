import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { mockSkills } from "./skill-fixture";
import { getGoods } from "../../src/lib/goods";
const id = "visual-solo-planned--motion-01";
const card = getGoods(id)!;

test("모션 카드 봉인·3별 해금·소장·반복 재생과 연출 다시 보기를 연결한다", async ({
  page,
}) => {
  const state = await mockSkills(page);
  state.goods.balance = 3;
  let purchases = 0,
    videoRequests = 0;
  await page.route("**/api/goods", async (route) => {
    let outcome = "already_owned";
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON().id).toBe(id);
      if (!state.goods.owned.includes(id)) {
        state.goods.balance -= 3;
        state.goods.owned.push(id);
        purchases++;
        outcome = "redeemed";
      }
    }
    await route.fulfill({
      json: {
        accountId: "e1dcbb36-9c6e-4de6-8f57-f11b43765a7c",
        progress: state.goods,
        outcome,
      },
    });
  });
  const video = await readFile(`art/goods-motion/${id}.mp4`);
  await page.route("**/api/goods/video?*", async (route) => {
    videoRequests++;
    if (!state.goods.owned.includes(id))
      return route.fulfill({ status: 403, json: { error: "goods_required" } });
    return route.fulfill({ contentType: "video/mp4", body: video });
  });
  const poster = await sharp(`public/goods/${id}.webp`).jpeg().toBuffer();
  await page.route("**/api/goods/image?*", (r) =>
    r.fulfill({ contentType: "image/jpeg", body: poster }),
  );
  await page.goto("/goods");
  await page
    .getByRole("button", { name: "스페셜 모션 카드", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(1);
  await page
    .getByRole("button", { name: `루미 ${card.title} 카드 보기` })
    .click();
  await expect(page.getByRole("dialog").locator("video")).toHaveCount(0);
  expect(videoRequests).toBe(0);
  await page.getByRole("button", { name: "별 3개로 교환하기" }).click();
  await page
    .getByRole("button", { name: "별 3개로 교환", exact: true })
    .click();
  const reveal = page.getByRole("region", { name: "굿즈 해금 연출" });
  await expect(reveal).toBeVisible();
  await expect(reveal.locator("video")).toHaveCount(1, { timeout: 10000 });
  await page.screenshot({
    path: `test-results/motion-unlock-${test.info().project.name}.png`,
  });
  await expect(reveal).toHaveCount(0, { timeout: 12000 });
  const player = page.getByLabel("루미 스페셜 카드 영상");
  await expect
    .poll(() => player.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.1);
  expect(purchases).toBe(1);
  expect(state.goods.balance).toBe(0);
  await expect(
    page.getByRole("link", { name: "영상 저장", exact: true }),
  ).toHaveAttribute("href", /download=1/);
  await page.getByRole("button", { name: "해금 연출 다시 보기" }).click();
  await expect(reveal).toBeVisible();
  await page.getByRole("button", { name: "연출 건너뛰기" }).click();
  expect(purchases).toBe(1);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByLabel("내 굿즈만").check();
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(1);
  await page
    .getByRole("button", { name: `루미 ${card.title} 카드 보기` })
    .click();
  await page.getByRole("button", { name: "처음부터 영상 재생" }).click();
  await expect
    .poll(() => player.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.2);
  expect(purchases).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/motion-owned-${test.info().project.name}.png`,
  });
});

test("별이 2개면 모션 해금 불가, 모션 줄이기에서는 소장 영상을 자동 재생하지 않는다", async ({
  page,
}) => {
  const state = await mockSkills(page);
  state.goods.balance = 2;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/goods");
  await page
    .getByRole("button", { name: "스페셜 모션 카드", exact: true })
    .click();
  await page
    .getByRole("button", { name: `루미 ${card.title} 카드 보기` })
    .click();
  await expect(
    page.getByRole("button", { name: "별 3개로 교환하기" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  state.goods.owned = [id];
  await page.route("**/api/goods/video?*", (r) =>
    r.fulfill({ contentType: "video/mp4", path: `art/goods-motion/${id}.mp4` }),
  );
  await page.reload();
  await page
    .getByRole("button", { name: `루미 ${card.title} 카드 보기` })
    .click();
  await expect(page.getByLabel("루미 스페셜 카드 영상")).toBeVisible();
  expect(
    await page
      .getByLabel("루미 스페셜 카드 영상")
      .evaluate((v: HTMLVideoElement) => v.paused),
  ).toBe(true);
  await page.getByRole("button", { name: "해금 연출 다시 보기" }).click();
  await expect(
    page.getByRole("region", { name: "굿즈 해금 연출" }),
  ).toHaveCount(0, { timeout: 5000 });
  expect(
    await page
      .getByLabel("루미 스페셜 카드 영상")
      .evaluate((v: HTMLVideoElement) => v.paused),
  ).toBe(true);
});
