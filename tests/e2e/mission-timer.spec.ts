import { test, expect } from "@playwright/test";

test("홈에서 고른 과제로 공부법이 열리고 10분 타이머를 멈췄다 이어 끝낼 수 있음", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "용어 암기", exact: true }).click();
  await page.locator('.method-preview-card[data-family="visual"]').click();
  await expect(page).toHaveURL(/\/methods\/visual\?task=memory$/);
  await expect(page.locator(".mission-panel h2")).toHaveText("가림 비교표");
  await expect(
    page.getByRole("button", { name: "용어 암기", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  const timer = page.getByRole("timer");
  await page.getByRole("button", { name: "지금 10분 해보기" }).click();
  await page.clock.runFor(20_000);
  await expect(timer).toContainText("09:40");

  await page.getByRole("button", { name: "잠시 멈추기" }).click();
  await expect(page.locator(".mission-timer")).toContainText("잠시 멈췄어요");
  await page.clock.runFor(30_000);
  await expect(timer).toContainText("09:40");

  await page.getByRole("button", { name: "이어서 하기" }).click();
  // 끝나는 시각 기준으로 계산하므로 10분을 한 번에 건너뛰어도 끝나야 해요.
  await page.clock.fastForward(10 * 60_000);
  await expect(timer).toContainText("00:00");
  await expect(page.locator(".mission-timer")).toContainText("10분 끝!");

  await page.getByRole("button", { name: "10분 더 하기" }).click();
  await page.clock.runFor(1_000);
  await expect(timer).toContainText("09:59");
  await page.getByRole("button", { name: "그만하기" }).click();
  await expect(timer).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "다시 10분 해보기" }),
  ).toBeVisible();
});
