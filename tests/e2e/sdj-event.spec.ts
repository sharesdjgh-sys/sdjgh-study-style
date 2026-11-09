import { test, expect, type Page } from "@playwright/test";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";

async function setup(page: Page, signedIn = false) {
  let registered = false,
    fail = false,
    posts = 0;
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        signedIn,
        configured: true,
        ...(signedIn ? { accountId: "sdj-test" } : {}),
      },
    }),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        signedIn,
        configured: true,
        ...(signedIn ? { accountId: "sdj-test" } : {}),
      },
    }),
  );
  await page.route("**/api/results", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await page.route("**/api/skills", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route("**/api/goods", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route("**/api/events", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await page.route("**/api/events/sdj", async (route) => {
    if (route.request().method() === "POST") {
      posts++;
      expect(route.request().postDataJSON()).toEqual({ source: "poster_qr" });
      if (fail)
        return route.fulfill({ status: 503, json: { error: "unavailable" } });
      registered = true;
    }
    return route.fulfill({
      json: {
        enrolled: registered,
        enrolledAt: registered ? "2026-10-15T00:00:00.000Z" : null,
      },
    });
  });
  return {
    get posts() {
      return posts;
    },
    fail(value: boolean) {
      fail = value;
    },
    logout() {
      signedIn = false;
    },
  };
}
const joinArea = (page: Page) =>
  page.locator('[aria-label="이벤트 사전 참여"]');

test("행사 페이지는 캐릭터 앞면을 노출하지 않고 로그인 복귀 주소를 전달한다", async ({
  page,
}) => {
  const state = await setup(page);
  let returnPath = "";
  const imageRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "image")
      imageRequests.push(decodeURIComponent(request.url()));
  });
  await page.route("**/api/auth/kakao/start?*", (route) => {
    returnPath =
      new URL(route.request().url()).searchParams.get("returnTo") ?? "";
    return route.fulfill({ status: 503, json: { error: "unavailable" } });
  });
  await page.goto("/events/sdj?from=qr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "특별한 카드.",
  );
  await expect(page.getByText("카드별 수량 추후 공개")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "앞면을 공개하지 않은 서여고 한정 카드" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const forbidden =
    /(?:visual|auditory|tactile|motion)-[a-z-]+--(?:special|daily)|group-photo|sdj-character-v2|sdj-school-v2/;
  expect(await page.locator("main").innerHTML()).not.toMatch(forbidden);
  expect(
    (await page.locator('meta[property="og:image"]').getAttribute("content")) ??
      "",
  ).not.toMatch(forbidden);
  expect(
    (await page
      .locator('meta[name="twitter:image"]')
      .getAttribute("content")) ?? "",
  ).not.toMatch(forbidden);
  expect(imageRequests.filter((url) => forbidden.test(url))).toEqual([]);
  await expect(page.locator("main")).not.toContainText(/루미|토리|멜로|바니/);
  await joinArea(page)
    .getByRole("button", { name: "카카오로 로그인하고 신청하기" })
    .click();
  await expect(joinArea(page)).toContainText("로그인을 시작하지 못했어요");
  expect(returnPath).toBe("/events/sdj?from=qr&join=1");
  expect(state.posts).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("기존 회원도 명시적으로 참여하고 새로고침 후 등록을 유지한다", async ({
  page,
}) => {
  const state = await setup(page, true);
  await page.goto("/events/sdj?from=qr");
  await expect(
    joinArea(page).getByRole("button", {
      name: "이 계정으로 참가 신청",
    }),
  ).toBeEnabled();
  expect(state.posts).toBe(0);
  await joinArea(page)
    .getByRole("button", { name: "이 계정으로 참가 신청" })
    .click();
  await expect(joinArea(page)).toContainText("참가 신청 완료");
  await page.reload();
  await expect(joinArea(page)).toContainText("참가 신청 완료");
  expect(state.posts).toBe(1);
  state.logout();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    joinArea(page).getByRole("button", {
      name: "카카오로 로그인하고 신청하기",
    }),
  ).toBeEnabled();
  await expect(joinArea(page)).not.toContainText("참가 신청 완료");
});

test("카카오 복귀 후 등록 실패를 알리고 재시도하면 완료하며 중복 등록하지 않는다", async ({
  page,
}) => {
  const state = await setup(page, true);
  state.fail(true);
  await page.goto("/events/sdj?from=qr&join=1&auth=success");
  await expect(joinArea(page)).toContainText("참여 내역을 확인하지 못했어요");
  await expect(joinArea(page)).not.toContainText("참가 신청 완료");
  state.fail(false);
  await joinArea(page)
    .getByRole("button", { name: "참여 정보 다시 확인" })
    .click();
  await expect(joinArea(page)).toContainText("참가 신청 완료");
  await expect(joinArea(page)).not.toContainText("확인하지 못했어요");
  expect(page.url()).not.toContain("join=1");
  await page.reload();
  await expect(joinArea(page)).toContainText("참가 신청 완료");
  expect(state.posts).toBe(2);
});

test("로그인 취소는 안내하고 참여 등록으로 처리하지 않는다", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/events/sdj?from=qr&join=1&auth=cancelled");
  await expect(joinArea(page)).toContainText("카카오 로그인을 취소했어요");
  expect(state.posts).toBe(0);
});
