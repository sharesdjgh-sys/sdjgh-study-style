import { test, expect, type Page } from "@playwright/test";
import { QUESTIONS, VERSION, STUDY_TYPES } from "../../src/lib/content";
import { readFile } from "node:fs/promises";
import {
  EMPTY_COLLECTION,
  type CollectionData,
} from "../../src/lib/collection-contract";
const base = "visual-solo-planned";
const second = "auditory-solo-planned";
const third = "motion-team-flexible";
function complete(code = base, isRetake = false) {
  const now = Date.now();
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    source: "direct",
    startedAt: now,
    updatedAt: now,
    completedAt: now,
    index: 15,
    choices: {},
    result: code,
    isRetake,
    answers: Object.fromEntries(
      QUESTIONS.map((q) => [q.id, code.split("-").includes(q.axis) ? 5 : 1]),
    ),
  };
}
async function seed(page: Page) {
  const first = complete();
  await page.goto("/");
  await page.evaluate((s) => {
    localStorage.setItem("study-style:session", JSON.stringify(s));
    localStorage.setItem("study-style:first-result", JSON.stringify(s));
  }, first);
  return first;
}
async function server(page: Page, initial: CollectionData) {
  const state = { data: initial };
  await page.route("**/api/collection", (route) =>
    route.fulfill({ json: state.data }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  return state;
}

test("16번째 선물을 개봉하면 스페셜 사진이 열리고 확대·저장·복원이 된다", async ({
  page,
}, testInfo) => {
  const last = STUDY_TYPES.at(-1)!.code;
  const state = await server(page, {
    ...EMPTY_COLLECTION,
    configured: true,
    signedIn: true,
    firstType: base,
    firstRunId: crypto.randomUUID(),
    inviteCode: "ABCDEF1234",
    cards: STUDY_TYPES.slice(0, -1).map((type) => ({
      code: type.code,
      source: "referral",
    })),
    pending: [{ id: crypto.randomUUID() }],
    referralCount: 15,
  });
  let photographRequests = 0;
  await page.route("**/api/collection/special-card*", async (route) => {
    photographRequests++;
    if (photographRequests === 1)
      return route.fulfill({ status: 503, json: { error: "unavailable" } });
    const download =
      new URL(route.request().url()).searchParams.get("download") === "1";
    return route.fulfill({
      body: await readFile(
        `art/characters/special/group-photo.${download ? "png" : "webp"}`,
      ),
      contentType: download ? "image/png" : "image/webp",
      headers: download
        ? {
            "Content-Disposition":
              'attachment; filename="gongbucae-special-16.png"',
          }
        : {},
    });
  });
  await page.route("**/api/collection/rewards/open", (route) => {
    state.data = {
      ...state.data,
      cards: [...state.data.cards, { code: last, source: "referral" }],
      pending: [],
    };
    return route.fulfill({ json: { code: last } });
  });
  await page.goto("/collection");
  const card = page.getByRole("region", { name: "도감 완성 스페셜 카드" });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText("1명의 친구를 더 만나면 완성!");
  await expect(card.locator("img")).toHaveCount(0);
  expect(photographRequests).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await card.screenshot({
    path: `.artifacts/special-locked-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "두근두근, 열어보기" }).click();
  await page.getByRole("button", { name: "도감에서 만나기" }).click();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText("스페셜 카드 획득 완료");
  await expect(card.getByRole("status")).toContainText(
    "도감 완성 기록은 그대로예요",
  );
  await card.getByRole("button", { name: "다시 불러오기" }).click();
  await expect
    .poll(() =>
      card.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(1664);
  await card.screenshot({
    path: `.artifacts/special-complete-${testInfo.project.name}.png`,
  });
  const enlarge = card.getByRole("button", {
    name: "단체사진 크게 보기",
    exact: true,
  });
  await enlarge.click();
  const dialog = page.getByRole("dialog", { name: "우리, 드디어 다 모였다!" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog
        .locator("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(1664);
  await page.screenshot({
    path: `.artifacts/special-dialog-${testInfo.project.name}.png`,
  });
  const downloaded = page.waitForEvent("download");
  await dialog.getByRole("link", { name: "단체사진 저장하기" }).click();
  expect((await downloaded).suggestedFilename()).toBe(
    "공부캐-스페셜-단체사진.png",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(enlarge).toBeFocused();
  await page.reload();
  await expect(card).toContainText("스페셜 카드 획득 완료");
  if (testInfo.project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 700 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  state.data = { ...EMPTY_COLLECTION, configured: true };
  await page.reload();
  await expect(card.locator("img")).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "이미지 저장하기 ↓" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("첫 캐릭터는 비로그인 공개, 재검사는 분석부터 결과까지 실루엣이고 최초 결과를 보존", async ({
  page,
}) => {
  await server(page, { ...EMPTY_COLLECTION, configured: true });
  const first = await seed(page);
  await page.goto("/result");
  await expect(page.locator(".character-name")).toHaveText("루미");
  await expect(
    page.getByRole("link", { name: "내 도감 시작하기 →" }),
  ).toBeVisible();
  await page.goto("/quiz");
  await page
    .getByRole("button", { name: "다시 검사하기", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("실루엣");
  await page.getByRole("button", { name: "새로 시작", exact: true }).click();
  await expect(page.locator(".quiz-collection-notice")).toContainText(
    "새 캐릭터는 추가되지 않아요",
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("study-style:session")!),
  );
  expect(saved.isRetake).toBe(true);
  const retake = {
    ...complete(third, true),
    result: null,
    completedAt: undefined,
  };
  await page.evaluate(
    (s) => localStorage.setItem("study-style:session", JSON.stringify(s)),
    retake,
  );
  await page.reload();
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page.locator(".discovery-shell")).toHaveAttribute(
    "data-stage",
    "3",
  );
  await expect(page.locator(".discovery-revealed")).toHaveCount(0);
  await expect(page.locator(".discovery-silhouette")).toHaveCount(16);
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.locator(".result-character .mystery-card")).toHaveCount(1);
  await expect(page.locator(".character-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "내 공부캐 링크 복사" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("study-style:first-result")!).runId,
    ),
  ).toBe(first.runId);
  await page.goto("/types");
  await expect(page.locator(".character-name")).toHaveText("루미");
});

test("계정 도감 복원과 선물 개봉, 수집한 캐릭터만 공개하고 추천 코드로 공유", async ({
  page,
}) => {
  const state = await server(page, {
    ...EMPTY_COLLECTION,
    configured: true,
    signedIn: true,
    firstType: base,
    firstRunId: crypto.randomUUID(),
    inviteCode: "ABCDEF1234",
    cards: [
      { code: base, source: "first" },
      { code: second, source: "referral" },
    ],
    pending: [{ id: crypto.randomUUID() }],
    referralCount: 2,
  });
  await page.route("**/api/collection/rewards/open", (route) => {
    state.data = {
      ...state.data,
      cards: [...state.data.cards, { code: third, source: "referral" }],
      pending: [],
    };
    return route.fulfill({ json: { code: third } });
  });
  await page.goto("/collection");
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    2,
  );
  await expect(page.locator(".character-gallery .mystery-card")).toHaveCount(
    14,
  );
  await page.getByRole("button", { name: "두근두근, 열어보기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "스킵, 도감에 합류!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "도감에서 만나기" }).click();
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    3,
  );
  await page.reload();
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    3,
  );
  await expect(
    page.getByRole("button", { name: "두근두근, 열어보기" }),
  ).toHaveCount(0);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("blocked")) },
    }),
  );
  await page.getByRole("button", { name: "내 공부캐 링크 복사" }).click();
  await expect(page.getByRole("textbox", { name: "복사할 주소" })).toHaveValue(
    /\/share\/visual-solo-planned\?from=share&ref=ABCDEF1234$/,
  );
  await page.goto("/types/motion-team-flexible");
  await expect(page.locator(".character-name")).toHaveText("스킵");
  await page.goto("/types/tactile-team-flexible");
  await expect(page.locator(".mystery-card")).toHaveCount(1);
});

test("첫 결과 등록 실패 후 재시도하며 최근 재검사 대신 최초 결과를 전송", async ({
  page,
}) => {
  const state = await server(page, {
    ...EMPTY_COLLECTION,
    configured: true,
    signedIn: true,
  });
  const first = await seed(page);
  await page.evaluate(
    (s) => localStorage.setItem("study-style:session", JSON.stringify(s)),
    complete(third, true),
  );
  let attempts = 0;
  await page.route("**/api/collection/register", (route) => {
    expect(route.request().postDataJSON().session.runId).toBe(first.runId);
    if (++attempts === 1)
      return route.fulfill({ status: 503, json: { error: "unavailable" } });
    state.data = {
      ...state.data,
      firstType: base,
      firstRunId: first.runId,
      inviteCode: "ABCDEF1234",
      cards: [{ code: base, source: "first" }],
    };
    return route.fulfill({ json: { outcome: "registered" } });
  });
  await page.goto("/collection");
  await expect(page.locator(".collection-first-name")).toContainText("루미");
  await page.getByRole("button", { name: "첫 캐릭터 도감에 저장하기" }).click();
  await expect(page.locator(".collection-panel [role=status]")).toContainText(
    "다시 시도",
  );
  await page.getByRole("button", { name: "첫 캐릭터 도감에 저장하기" }).click();
  await expect(page.locator(".collection-summary")).toContainText("루미");
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    1,
  );
  expect(attempts).toBe(2);
});

test("공유 링크 추천 정보를 검사로 전달하며 클릭만으로 보상을 요청하지 않음", async ({
  page,
}) => {
  await server(page, { ...EMPTY_COLLECTION, configured: true });
  let captures = 0;
  let awards = 0;
  await page.route("**/api/referrals", (route) => {
    if (route.request().method() === "POST") captures++;
    return route.fulfill({ json: { code: "ABCDEF1234" } });
  });
  page.on("request", (request) => {
    if (
      request.url().includes("/api/collection/register") ||
      request.url().includes("/api/collection/rewards/open")
    )
      awards++;
  });
  await page.goto("/share/motion-team-flexible?from=share&ref=ABCDEF1234");
  await page.getByRole("link", { name: "나도 내 공부캐 찾기 →" }).click();
  await expect(page).toHaveURL(/\/quiz\?from=share&ref=ABCDEF1234$/);
  await expect(page.locator(".quiz-collection-notice")).toBeVisible();
  expect(captures).toBeGreaterThan(0);
  expect(awards).toBe(0);
});

test("로그인 취소와 서버 장애에도 검사 가능, 계정 삭제는 확인 후 처리", async ({
  page,
}) => {
  const state = await server(page, {
    ...EMPTY_COLLECTION,
    configured: true,
    signedIn: true,
    firstType: base,
    firstRunId: crypto.randomUUID(),
    inviteCode: "ABCDEF1234",
    cards: [{ code: base, source: "first" }],
  });
  await page.route("**/api/collection/account", (route) => {
    state.data = { ...EMPTY_COLLECTION, configured: true };
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/collection");
  await page
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    1,
  );
  await page
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "카카오 로그인" }),
  ).toBeVisible();
  await page.goto("/collection?auth=cancelled");
  await expect(
    page.getByRole("status").filter({ hasText: "로그인을 취소했어요" }),
  ).toBeVisible();
  await page.route("**/api/collection", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "다시 불러오기" }),
  ).toBeVisible();
  await page.goto("/quiz");
  await expect(page.locator(".question-number")).toHaveText("질문 01");
});
