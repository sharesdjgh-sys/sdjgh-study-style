import { expect, test, type Page } from "@playwright/test";
import {
  EMPTY_COLLECTION,
  type CollectionData,
} from "../../src/lib/collection-contract";
import { STUDY_TYPES } from "../../src/lib/content";
import { mockSkills } from "./skill-fixture";

async function invitation(page: Page) {
  const auth = await mockSkills(page);
  const state: { data: CollectionData } = {
    data: {
      ...EMPTY_COLLECTION,
      configured: true,
      signedIn: true,
      accountId: "e1dcbb36-9c6e-4de6-8f57-f11b43765a7c",
      firstType: "visual-solo-planned",
      inviteCode: "ABCDEF1234",
      cards: [{ code: "visual-solo-planned", source: "first" }],
    },
  };
  await page.route("**/api/collection", (route) =>
    route.fulfill({ json: state.data }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await page.route("https://t1.kakaocdn.net/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.Kakao = { init() {}, isInitialized() { return true; }, Share: { sendDefault(value) { window.__invitationShare = value; } } };",
    }),
  );
  return { state, auth };
}

test("상단은 초대 보상을 안내하고 공유 버튼은 기존 수집 노트에만 표시한다", async ({
  page,
}, testInfo) => {
  await invitation(page);
  await page.goto("/collection", { waitUntil: "domcontentloaded" });
  const hero = page.locator("#invite-friends");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText(
    "내 공부캐는 루미.",
  );
  await expect(hero).toContainText("나도 1명, 친구도 1명.");
  await expect(
    hero.getByRole("img", { name: "루미 시그니처 배지 · 획득", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".character-gallery, .catalog-family-tabs"),
  ).toHaveCount(0);
  await expect(
    hero.getByRole("link", { name: /16명 모두 모으면/ }),
  ).toHaveAttribute("href", "/types#collection-completion");
  await expect(hero).toContainText("카드를 열면 시그니처 스킬도 함께!");
  const rewards = hero.getByRole("list", { name: "카드 개봉 추가 보상" });
  await expect(rewards).toContainText("하트 1~3개");
  await expect(rewards).toContainText("별 1~2개");
  await expect(hero.getByRole("button")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /카카오톡.*공유|카카오톡.*초대/ }),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: /링크 복사/ })).toHaveCount(1);
  const notebook = page.getByRole("region", { name: "내 도감 관리" });
  await expect(
    notebook.getByText("공부 친구 수집 노트", { exact: true }),
  ).toBeVisible();
  await expect(
    notebook.getByRole("heading", { name: "친구의 발견이, 나의 새 친구로." }),
  ).toBeVisible();
  await expect(
    notebook.getByRole("button", {
      name: "내 공부캐 카카오톡 공유",
      exact: true,
    }),
  ).toHaveCount(1);
  await page.waitForFunction(() => !!window.Kakao);
  await notebook
    .getByRole("button", { name: "내 공부캐 카카오톡 공유", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __invitationShare?: { content: { link: { webUrl: string } } };
            }
          ).__invitationShare?.content.link.webUrl,
      ),
    )
    .toMatch(/\/share\/visual-solo-planned\?from=share&ref=ABCDEF1234$/);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("blocked")) },
    }),
  );
  await notebook
    .getByRole("button", { name: "내 공부캐 링크 복사", exact: true })
    .click();
  await expect(
    notebook.getByRole("textbox", { name: "복사할 주소" }),
  ).toHaveValue(/ref=ABCDEF1234$/);
  await expect(page.locator(".skill-wallet, .star-wallet")).toHaveCount(0);
  const history = page
    .locator("details")
    .filter({ has: page.locator(".saved-results") });
  await expect(history).not.toHaveAttribute("open");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await hero.screenshot({ path: testInfo.outputPath("invitation.png") });
});

test("선물 개봉 후 실제 하트와 별 보상을 표시하고 계정 잔액을 갱신한다", async ({
  page,
}) => {
  const { state, auth } = await invitation(page);
  state.data.pending = [{ id: "c24d667e-d860-4faa-a231-7661bc5aaee9" }];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/collection/rewards/open", (route) => {
    state.data.pending = [];
    state.data.cards.push({ code: "visual-solo-flexible", source: "referral" });
    auth.goods.balance = 2;
    auth.goods.entries = [
      {
        id: "stars",
        amount: 2,
        reason: "card",
        reference: "visual-solo-flexible",
        createdAt: new Date().toISOString(),
      },
    ];
    auth.progress.entries = [
      {
        id: "hearts",
        amount: 3,
        reason: "card",
        reference: "visual-solo-flexible",
        createdAt: new Date().toISOString(),
      },
    ];
    return route.fulfill({ json: { code: "visual-solo-flexible" } });
  });
  await page.goto("/collection");
  await page.getByRole("button", { name: "두근두근, 열어보기" }).click();
  await page.getByRole("button", { name: "선물 포장 열기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("하트 3개도 함께 도착했어요!");
  await expect(dialog).toContainText("별 2개도 받았어요!");
  await page.getByRole("button", { name: "도감에서 만나기" }).click();
  await page.goto("/goods");
  await expect(page.locator(".star-balance strong")).toHaveText("2");
});

test("초대 완료·도감 완성·비로그인 상태에 맞는 다음 행동을 안내한다", async ({
  page,
}) => {
  const { state, auth } = await invitation(page);
  state.data.pending = Array.from({ length: 15 }, (_, i) => ({
    id: `gift-${i}`,
  }));
  await page.goto("/collection", { waitUntil: "domcontentloaded" });
  const hero = page.locator("#invite-friends");
  await expect(hero).toContainText("필요한 초대는 모두 끝났어요.");
  await expect(
    hero.getByRole("link", { name: "도착한 선물 열러 가기 →" }),
  ).toHaveAttribute("href", "#reward-inbox");
  await expect(
    hero.getByRole("button", { name: "초대 링크 복사" }),
  ).toHaveCount(0);
  state.data.pending = [];
  state.data.cards = STUDY_TYPES.map((type) => ({
    code: type.code,
    source: "referral",
  }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(hero.getByRole("heading", { level: 1 })).toContainText(
    "열여섯 친구를 다 모았어.",
  );
  await expect(hero).not.toContainText("나도 1명, 친구도 1명.");
  await expect(
    hero.getByRole("list", { name: "카드 개봉 추가 보상" }),
  ).toHaveCount(0);
  auth.signedIn = false;
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    hero.getByRole("link", { name: "로그인하고 내 초대 링크 만들기 →" }),
  ).toHaveAttribute("href", "#collection-notebook");
  await expect(hero.locator(".signature-badge")).toHaveCount(0);
  await expect(
    hero.getByRole("button", { name: "초대 링크 복사" }),
  ).toHaveCount(0);
});
