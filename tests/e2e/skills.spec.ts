import { test, expect } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
test("하트로 잠금을 열고 재방문해도 유지하며 로그아웃하면 다시 숨긴다", async ({
  page,
}, info) => {
  const state = await mockSkills(page);
  await page.goto("/methods/cornell");
  await expect(page.locator(".skill-gate h2")).toHaveText("코넬 노트");
  await expect(page.locator(".skill-scene")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "하트 2개 사용해 열기" }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("skill-locked.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "하트 2개 사용해 열기" }).click();
  await expect(page.locator(".skill-scene")).toBeVisible();
  expect(state.progress.balance).toBe(1);
  expect(state.unlocks).toBe(1);
  await expect(
    page.getByRole("button", { name: "지금 10분 해보기" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("skill-open.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator(".skill-scene")).toBeVisible();
  expect(state.unlocks).toBe(1);
  state.signedIn = false;
  await page.reload();
  await expect(page.locator(".skill-gate")).toBeVisible();
  await expect(page.locator(".skill-scene")).toHaveCount(0);
});
test("카탈로그의 잠긴 카드와 모바일 상세 시트가 그림을 숨긴다", async ({
  page,
  isMobile,
}, info) => {
  await mockSkills(page);
  await page.goto("/methods");
  await expect(page.locator(".skill-tile")).toHaveCount(28);
  await expect(page.locator(".skill-tile[data-unlocked=true]")).toHaveCount(1);
  await page.locator("#catalog-memory").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("skill-catalog.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".skill-tile", { hasText: "코넬 노트" }).click();
  if (isMobile) {
    const sheet = page.getByRole("dialog", { name: "코넬 노트" });
    await expect(sheet).toBeVisible();
    await expect(sheet.locator(".skill-scene")).toHaveCount(0);
    await sheet.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(sheet).toBeHidden();
  } else {
    await expect(page).toHaveURL(/\/methods\/cornell$/);
    await expect(page.locator(".skill-gate")).toBeVisible();
  }
});
test("설치된 모바일 앱은 설치 선물을 한 번만 받는다", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "모바일 설치 보상");
  const state = await mockSkills(page);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { get: () => true }),
  );
  await page.goto("/methods");
  await page.getByRole("button", { name: "설치 선물 받기" }).click();
  await expect(
    page.getByText("설치 선물, 하트 3개가 도착했어요!"),
  ).toBeVisible();
  expect(state.progress.balance).toBe(6);
  expect(state.installs).toBe(1);
  await page.reload();
  await expect(page.getByText("설치 선물 받음", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "설치 선물 받기" }),
  ).toHaveCount(0);
});
test("태블릿에서 3열·PC에서 4열로 표시하고 가로 넘침이 없다", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "데스크톱에서 화면 폭 검증");
  await mockSkills(page);
  for (const [width, columns] of [
    [1024, 3],
    [1440, 4],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/methods");
    await expect(page.locator(".skill-tile")).toHaveCount(28);
    expect(
      await page
        .locator(".skill-card-grid")
        .first()
        .evaluate(
          (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(columns);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
