import { expect, test } from "@playwright/test";

test("포스터 QR에서 실제 배지 카드를 살펴보고 공부캐 검사로 이동한다", async ({
  page,
}) => {
  await page.goto("/events/sdj?from=qr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("스페셜 이벤트");
  await expect(page.locator('a[href="/admin/sdj-prizes"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /운영자 로그인/ })).toHaveCount(0);
  const samples = page.locator("#examples article");
  await expect(
    page.getByRole("heading", { name: "팡팡스타", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "메이즈런", exact: true }),
  ).toBeVisible();
  const scenes = page.locator("#games figure");
  await expect(scenes).toHaveCount(2);
  for (const scene of await scenes.all()) {
    const image = scene.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    const url = await scene.getByRole("link").getAttribute("href");
    expect((await page.request.get(url!)).ok()).toBeTruthy();
  }
  await expect(samples).toHaveCount(2);
  const positions = await samples.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().top),
  );
  expect(Math.abs(positions[0] - positions[1])).toBeLessThan(1);
  for (const sample of await samples.all()) {
    const image = sample.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    const link = sample.getByRole("link");
    expect(
      (await page.request.get((await link.getAttribute("href"))!)).ok(),
    ).toBeTruthy();
  }
  await samples.first().getByRole("button", { name: "뒷면 보기" }).click();
  await expect(samples.first()).toContainText("SDJGH-06 (예시)");
  await samples.first().getByRole("button", { name: "앞면 보기" }).click();
  await samples.first().getByText("교표 위치 힌트").click();
  await expect(
    samples.first().getByText("코코아 머그잔을 살펴보세요."),
  ).toBeVisible();
  await expect(page.locator("#participate")).toContainText("10,000원 × 1건");
  await expect(page.locator("#participate")).toContainText("14,000원");
  await expect(
    page.getByRole("button", { name: "카카오톡으로 로그인하고 내 공부캐 찾기" }),
  ).toBeVisible();
  await expect(page.getByText("도감에서 랜덤 공부캐 카드 열기")).toBeVisible();
});


test("일반 행사 링크에서도 카카오톡 로그인으로 참여를 시작한다", async ({ page }) => {
  await page.goto("/events/sdj");
  await expect(page).toHaveURL(/\/events\/sdj\?from=qr$/);
  await expect(page.locator("#start").getByRole("button", {
    name: "카카오톡으로 로그인하고 내 공부캐 찾기",
  })).toBeVisible();
  await expect(page.locator('#start a[href="/quiz"]')).toHaveCount(0);
});
