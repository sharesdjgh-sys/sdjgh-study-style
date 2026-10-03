import { test, expect } from "@playwright/test";

test("공부법 도감에서 과제로 거르고, 아직 만나지 않은 캐릭터의 시그니처도 해 볼 수 있음", async ({
  page,
  isMobile,
}) => {
  await page.goto("/methods");
  await expect(page.locator(".catalog-card")).toHaveCount(28);
  await expect(page.locator(".basics-note")).toContainText("인출 연습");
  await page.getByRole("button", { name: "복습·리듬 4", exact: true }).click();
  await expect(page.locator(".catalog-card")).toHaveCount(4);
  // 만나지 않은 캐릭터의 이름은 감추고 방식만 알려 줘요.
  await expect(
    page.locator(".catalog-card", { hasText: "미니 퀴즈" }),
  ).toContainText("운동형 공부캐 한 명의 시그니처");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator(".catalog-card", { hasText: "미니 퀴즈" }).click();
  if (isMobile) {
    // 모바일은 아이콘 타일을 누르면 설명 팝업이 먼저 올라와요.
    const sheet = page.getByRole("dialog", { name: "미니 퀴즈" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "닫기" }).click();
    await expect(sheet).toBeHidden();
    await page.locator(".catalog-card", { hasText: "미니 퀴즈" }).click();
    await sheet.getByRole("link", { name: "10분 해보기" }).click();
  }
  await expect(page).toHaveURL(/\/methods\/mini-quiz$/);
  await expect(page.locator(".mission-panel h2")).toHaveText("미니 퀴즈");
  await expect(page.locator(".method-owner")).toContainText(
    "운동형 공부캐 한 명의 시그니처",
  );
  await expect(page.locator(".mission-panel")).toContainText("2분 규칙");
  await page.getByRole("button", { name: "지금 10분 해보기" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
});

test("모바일 하단 퀵메뉴로 이동하고, 검사 중에는 숨김", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "빠른 메뉴" });
  if (!isMobile) {
    await expect(menu).toBeHidden();
    return;
  }
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "공부법 도감" }).click();
  await expect(page).toHaveURL(/\/methods$/);
  await expect(menu.getByRole("link", { name: "공부법 도감" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goto("/quiz");
  await expect(menu).toHaveCount(0);
});

test("친구가 공유한 캐릭터의 시그니처 공부법으로 이동할 수 있음", async ({
  page,
}) => {
  await page.goto("/share/tactile-solo-planned");
  await expect(page.locator(".shared-signature")).toContainText("오답노트");
  await page.locator(".shared-signature a").click();
  await expect(page).toHaveURL(/\/methods\/error-note$/);
  await expect(page.locator(".mission-panel h2")).toHaveText("오답노트");
});
