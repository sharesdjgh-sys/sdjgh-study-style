import { test, expect } from "@playwright/test";
test("스킬북 분류를 이동하고 잠긴 시그니처는 미리보기만 제공한다", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ json: { signedIn: false, configured: true } }),
  );
  await page.goto("/methods");
  await expect(page.locator(".skill-tile")).toHaveCount(28);
  const categories = page.getByRole("navigation", {
    name: "공부법 분류 빠른 메뉴",
  });
  await expect(categories.getByRole("link")).toHaveCount(isMobile ? 5 : 4);
  await categories
    .getByRole("link", { name: "복습·리듬", exact: true })
    .click();
  await expect(page).toHaveURL(/#catalog-review$/);
  await page.locator(".skill-tile", { hasText: "미니 퀴즈" }).click();
  await expect(page.locator(".skill-gate h2")).toHaveText("미니 퀴즈");
  await expect(page.locator(".skill-scene")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "지금 10분 해보기" }),
  ).toHaveCount(0);
  if (isMobile) {
    await page
      .getByRole("dialog", { name: "미니 퀴즈" })
      .getByRole("button", { name: "닫기" })
      .click();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
});

test("모바일 하단 퀵메뉴로 이동하고, 검사 중에는 숨김", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "빠른 메뉴", exact: true });
  if (!isMobile) {
    await expect(menu).toBeHidden();
    return;
  }
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "공부 스킬북" }).click();
  await expect(page).toHaveURL(/\/methods$/);
  await expect(menu).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "공부법 분류 빠른 메뉴" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "공부법 분류 빠른 메뉴" })
    .getByRole("link", { name: "홈", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(menu).toBeVisible();
  await page.goto("/methods/mini-quiz");
  await expect(menu).toBeVisible();
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
  await expect(page.locator(".skill-gate h2")).toHaveText("오답노트");
});
