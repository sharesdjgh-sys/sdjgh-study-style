import { test, expect } from "@playwright/test";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { EMPTY_SKILLS } from "../../src/lib/skill-economy";
import { EMPTY_GOODS } from "../../src/lib/goods";

test("내 정보 메뉴는 모바일과 PC에서 연결되고 비로그인 안내를 표시한다", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: { signedIn: false, configured: true } }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page
      .getByRole("banner")
      .getByRole("button", { name: "카카오 로그인", exact: true }),
  ).toBeEnabled();
  const navigation = isMobile
    ? page.getByRole("navigation", { name: "빠른 메뉴", exact: true })
    : page.getByRole("navigation", { name: "주요 메뉴", exact: true });
  if (isMobile) await expect(navigation.getByRole("link")).toHaveCount(5);
  await navigation.getByRole("link", { name: "내 정보", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(
    page.getByRole("heading", { name: "내 정보", exact: true }),
  ).toBeVisible();
  const main = page.getByRole("main");
  const balances = main.getByRole("region", { name: "보유 하트와 별" });
  await expect(balances).toBeVisible();
  await expect(balances.locator("dt")).toHaveText(["하트", "별"]);
  await expect(balances.locator("strong")).toHaveText(["—", "—"]);
  await expect(
    main.locator(".skill-wallet, .star-wallet, .heart-history"),
  ).toHaveCount(0);
  await expect(
    main.getByRole("button", { name: "카카오 로그인", exact: true }),
  ).toBeEnabled();
  await expect(
    main.getByRole("button", { name: "계정·도감 삭제", exact: true }),
  ).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "계정 관리" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("account-overview.png"),
    fullPage: true,
  });
});

test("내 정보의 계정 삭제는 취소·실패 시 계정을 유지하고 성공 후 비로그인으로 전환한다", async ({
  page,
}) => {
  let authenticated = true;
  let succeed = false;
  let deletions = 0;
  const identity = {
    signedIn: true,
    configured: true,
    accountId: "account-overview-test",
  };
  await page.route("**/api/skills", (route) =>
    route.fulfill({
      json: {
        accountId: identity.accountId,
        progress: { ...EMPTY_SKILLS, balance: 7 },
      },
    }),
  );
  await page.route("**/api/goods", (route) =>
    route.fulfill({
      json: {
        accountId: identity.accountId,
        progress: { ...EMPTY_GOODS, balance: 4 },
      },
    }),
  );
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: authenticated ? identity : { signedIn: false, configured: true },
    }),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        ...identity,
        firstType: "visual-solo-planned",
      },
    }),
  );
  await page.route("**/api/results", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await page.route("**/api/collection/account", (route) => {
    deletions++;
    if (succeed) authenticated = false;
    return route.fulfill({
      status: succeed ? 200 : 503,
      json: succeed ? { ok: true } : { error: "unavailable" },
    });
  });
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const main = page.getByRole("main");
  await expect(main).toContainText("루미");
  await expect(
    main.getByRole("region", { name: "보유 하트와 별" }).locator("strong"),
  ).toHaveText(["7", "4"]);
  const remove = main.getByRole("button", {
    name: "계정·도감 삭제",
    exact: true,
  });
  const dialog = page.getByRole("dialog", {
    name: "계정과 도감을 삭제할까요?",
  });
  await remove.click();
  await expect(dialog).toContainText("7일간 재가입할 수 없고");
  await dialog.getByRole("button", { name: "취소", exact: true }).click();
  expect(deletions).toBe(0);
  await remove.click();
  await dialog
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await expect(main.getByRole("alert")).toContainText(
    "삭제 완료 여부를 확인하지 못했어요",
  );
  await expect(remove).toBeEnabled();
  succeed = true;
  await remove.click();
  await dialog
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await expect(
    main.getByRole("button", { name: "카카오 로그인", exact: true }),
  ).toBeEnabled();
  await expect(remove).toHaveCount(0);
  expect(deletions).toBe(2);
});
