import { test, expect } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";

const android =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36";
test.use({ userAgent: android });
const title = "다음엔 아이콘 한 번으로 만나요";

test("최초 로그인에서만 1회 안내하고 브라우저 기록 삭제 후에도 반복하지 않으며 수동으로 열 수 있음", async ({
  page,
}) => {
  const state = await mockSkills(page);
  state.installInvitation = true;
  await page.goto("/collection");
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: test.info().outputPath("install-prompt.png") });
  await dialog.getByRole("button", { name: "나중에 할게요" }).click();
  await expect(dialog).not.toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "앱 설치 안내", exact: true })
    .first()
    .click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "앱 설치 안내", exact: true }).first(),
  ).toBeFocused();
});

test("다른 페이지에서 받은 설치 이벤트를 보관하고 한 번만 사용하며 설치만으로 보상하지 않음", async ({
  page,
}) => {
  const state = await mockSkills(page);
  state.installInvitation = true;
  await page.goto("/methods");
  await expect(
    page.getByRole("button", { name: "앱 설치하기", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.body.dataset.prompts = String(
          Number(document.body.dataset.prompts ?? 0) + 1,
        );
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("navigation", { name: "푸터 메뉴" })
    .getByRole("link", { name: "내 도감", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "앱 설치하기", exact: true })
    .click();
  await expect(page.locator("body")).toHaveAttribute("data-prompts", "1");
  await dialog
    .getByRole("button", { name: "앱 설치하기", exact: true })
    .click();
  await expect(page.locator("body")).toHaveAttribute("data-prompts", "1");
  expect(state.installs).toBe(0);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByRole("dialog", { name: "설치가 완료됐어요!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "앱 설치 안내", exact: true }),
  ).toHaveCount(0);
});

test("아이폰 카카오톡에서는 외부 브라우저와 홈 화면 추가 순서를 안내", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "userAgent", {
      get: () => "iPhone AppleWebKit Mobile Safari KAKAOTALK",
    }),
  );
  const state = await mockSkills(page);
  state.installInvitation = true;
  await page.goto("/collection");
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "홈 화면에 추가하기" }).click();
  await expect(
    dialog.getByRole("heading", {
      name: "카카오톡 밖에서 한 번만 열어 주세요",
    }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Safari에서 이 페이지를 열어요."),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "앱 주소 복사" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("ios-install-help.png"),
  });
});

for (const mode of [
  "anonymous",
  "unsaved",
  "standalone",
  "returning",
] as const) {
  test(`${mode} 상태에는 설치 팝업을 자동 노출하지 않음`, async ({ page }) => {
    const state = await mockSkills(page);
    state.installInvitation = mode !== "returning";
    if (mode === "anonymous") state.signedIn = false;
    if (mode === "unsaved")
      await page.route("**/api/collection", (route) =>
        route.fulfill({
          json: {
            ...EMPTY_COLLECTION,
            signedIn: true,
            configured: true,
            accountId: "e1dcbb36-9c6e-4de6-8f57-f11b43765a7c",
          },
        }),
      );
    if (mode === "standalone")
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "standalone", { get: () => true }),
      );
    await page.goto("/collection");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(3000);
    await expect(page.getByRole("dialog", { name: title })).not.toBeVisible();
  });
}

test("비로그인 결과에서 카카오 로그인 후 도감으로 복귀하도록 요청", async ({
  page,
}) => {
  const state = await mockSkills(page);
  state.signedIn = false;
  const now = Date.now();
  const session = {
    version: VERSION,
    runId: crypto.randomUUID(),
    startedAt: now,
    updatedAt: now,
    completedAt: now,
    source: "direct",
    answers: answersFor("visual-solo-planned"),
    choices: {},
    index: QUESTIONS.length - 1,
    result: "visual-solo-planned",
  };
  await page.addInitScript((session) => {
    localStorage.setItem("study-style:session", JSON.stringify(session));
    localStorage.setItem("study-style:first-result", JSON.stringify(session));
  }, session);
  await page.route("**/api/auth/kakao/start?*", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.goto("/result");
  const button = page.getByRole("button", {
    name: "카카오로 내 공부캐 간직하기",
  });
  await expect(button).toBeEnabled();
  await page
    .getByRole("region", { name: "내 공부캐를 도감에 간직해요" })
    .screenshot({ path: test.info().outputPath("result-login.png") });
  const request = page.waitForRequest("**/api/auth/kakao/start?*");
  await button.click();
  expect(new URL((await request).url()).searchParams.get("returnTo")).toBe(
    "/collection",
  );
  await expect(
    page
      .getByText("로그인을 시작하지 못했어요. 잠시 후 다시 눌러 주세요.")
      .first(),
  ).toBeVisible();
});
