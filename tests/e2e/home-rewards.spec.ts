import { test, expect } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
test.use({
  userAgent:
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36",
});
test("바로가기 확인 보상 1개, 앱 실행 후 2개 추가", async ({ page }) => {
  const state = await mockSkills(page, { balance: 0 });
  await page.goto("/methods");
  await page
    .getByRole("button", { name: "앱 설치 방법 보기", exact: true })
    .click();
  expect(state.installs).toBe(0);
  await page
    .getByRole("button", { name: "설치 없이 웹페이지 바로가기 만들기" })
    .click();
  const claim = page.getByRole("button", {
    name: "바로가기 선물 받기 · 하트 1개",
  });
  await expect(claim).toBeDisabled();
  expect(state.shortcuts).toBe(0);
  await page
    .getByRole("checkbox", { name: "홈 화면에 바로가기를 추가했어요" })
    .check();
  await claim.click();
  await expect(
    page.getByText("홈 화면 선물, 하트 1개가 도착했어요!"),
  ).toBeVisible();
  expect(state.progress.balance).toBe(1);
  await page.reload();
  await expect(
    page.getByText("바로가기 선물 1개 받음 · 앱 설치 시 2개 더!"),
  ).toBeVisible();
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { get: () => true }),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "설치 선물 받기", exact: true })
    .click();
  await expect(
    page.getByText("홈 화면 선물, 하트 2개가 도착했어요!"),
  ).toBeVisible();
  expect(state.progress.balance).toBe(3);
  expect(state.installs).toBe(1);
  await page.reload();
  await expect(page.getByText("설치 선물 받음", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "설치 선물 받기", exact: true }),
  ).toHaveCount(0);
});
test("설치 안내와 설치 수락만으로 보상하지 않는다", async ({ page }) => {
  const state = await mockSkills(page);
  await page.goto("/methods");
  await expect(
    page.getByRole("button", { name: "앱 설치하기", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.body.dataset.installPrompts = "1";
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "앱 설치 방법 보기", exact: true })
    .click();
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-install-prompts",
  );
  await page.getByRole("button", { name: "앱 설치하기", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-install-prompts",
    "1",
  );
  expect(state.installs).toBe(0);
  await expect(
    page.getByRole("button", { name: "앱 설치하기", exact: true }),
  ).toBeDisabled();
});
test("공부친구 수집노트 공유 문구와 카카오 노란색", async ({ page }) => {
  await mockSkills(page);
  await page.goto("/collection");
  const share = page.getByRole("button", {
    name: "내 공부캐 카카오톡 공유",
    exact: true,
  });
  await expect(share).toBeVisible();
  await expect(share).toHaveCSS("background-color", "rgb(254, 229, 0)");
});
