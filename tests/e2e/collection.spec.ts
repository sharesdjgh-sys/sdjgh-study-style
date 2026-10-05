import { test, expect, type Page } from "@playwright/test";
import { QUESTIONS, VERSION, STUDY_TYPES } from "../../src/lib/content";
import { answersFor } from "../answers";
import { acceptQuizIntro } from "../quiz";
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
    index: QUESTIONS.length - 1,
    choices: {},
    result: code,
    isRetake,
    answers: answersFor(code),
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
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({
      json: {
        ...state.data,
        accountId: state.data.accountId ?? "test-account",
      },
    }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  return state;
}

test("첫 공부캐 1명과 초대 15명으로 완성하고 도착한 선물은 남은 초대에 포함하지 않는다", async ({
  page,
}) => {
  const state = await server(page, { ...EMPTY_COLLECTION, configured: true });
  const first = await seed(page);
  await page.route("**/api/collection/special-card*", async (route) =>
    route.fulfill({
      contentType: "image/webp",
      body: await readFile("art/characters/special/group-photo.webp"),
    }),
  );
  await page.goto("/types");
  const special = page.getByRole("region", { name: "도감 완성 스페셜 카드" });
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    1,
  );
  await expect(special.locator(".special-card-progress strong")).toHaveText(
    "1 / 16",
  );
  await expect(special).toContainText("15명의 친구를 더 초대하면 완성!");
  await expect(special.locator(".group-photo-silhouette img")).toHaveCount(16);
  await expect(special.locator(".special-photo-frame")).toHaveCount(0);
  await page.goto("/collection");
  await expect(page.locator(".collection-count")).toHaveText("1 / 16");
  state.data = { ...state.data, signedIn: true };
  await page.reload();
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    1,
  );
  await expect(special).toContainText("15명의 친구를 더 초대하면 완성!");
  await page.goto(`/types/${base}`);
  await expect(page.locator(".character-name")).toHaveText("루미");
  state.data = {
    ...state.data,
    firstType: base,
    firstRunId: first.runId,
    inviteCode: "ABCDEF1234",
    cards: [{ code: base, source: "first" }],
    pending: Array.from({ length: 14 }, () => ({ id: crypto.randomUUID() })),
    referralCount: 14,
  };
  await page.goto("/collection");
  await expect(special).toContainText("1명의 친구를 더 초대하면 완성!");
  state.data = {
    ...state.data,
    pending: [...state.data.pending, { id: crypto.randomUUID() }],
    referralCount: 15,
  };
  await page.reload();
  await expect(page.locator(".collection-count")).toHaveText("1 / 16");
  await expect(page.locator(".collection-invite-progress")).toContainText(
    "필요한 초대는 모두 완료했어요. 선물 15개만 개봉하면 완성",
  );
  await expect(special).toContainText("초대 완료! 선물 15개만 열면 완성!");
  await expect(special.locator(".group-photo-silhouette img")).toHaveCount(16);
  await expect(special.locator(".special-photo-frame")).toHaveCount(0);
  state.data = {
    ...state.data,
    cards: STUDY_TYPES.map((type, index) => ({
      code: type.code,
      source: index === 0 ? "first" : "referral",
    })),
    pending: [],
  };
  await page.reload();
  await expect(page.locator(".collection-count")).toHaveText("16 / 16");
  await expect(special).toContainText("스페셜 카드 획득 완료");
  await expect(special.locator("img")).toHaveCount(1);
});

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
    const family = new URL(route.request().url()).searchParams.get("family");
    if (family && ["visual", "auditory", "tactile", "motion"].includes(family))
      return route.fulfill({
        body: await readFile(`art/characters/special/families/${family}.webp`),
        contentType: "image/webp",
      });
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
  await expect(card).toContainText("초대 완료! 선물 1개만 열면 완성!");
  await expect(card.locator(".group-photo-silhouette img")).toHaveCount(16);
  await expect(card.locator(".special-photo-frame")).toHaveCount(0);
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
  await page.getByRole("button", { name: "선물 포장 열기" }).click();
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
  await expect(card.locator(".special-photo-frame")).toHaveCount(0);
  await expect(card.locator(".group-photo-silhouette img")).toHaveCount(16);
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
  await expect(
    page.getByText(/재검사에서는 새 캐릭터를 지급하지 않으며/),
  ).toBeVisible();
  await acceptQuizIntro(page);
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
  await acceptQuizIntro(page);
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
  await page.getByRole("button", { name: "선물 포장 열기" }).click();
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

for (const mode of ["video", "reduced", "failed", "skip"] as const) {
  const bonus = mode === "reduced";
  test(`${bonus ? "초대받은 친구" : "초대한 사용자"}가 선물 포장을 열고 새 카드와 다음 선물을 확인한다 (${mode})`, async ({
    page,
  }, testInfo) => {
    const firstRunId = crypto.randomUUID();
    const state = await server(page, {
      ...EMPTY_COLLECTION,
      signedIn: true,
      configured: true,
      firstType: bonus ? null : base,
      firstRunId: bonus ? null : firstRunId,
      inviteCode: "ABCDEF1234",
      cards: bonus ? [] : [{ code: base, source: "first" }],
      pending: bonus ? [] : [{ id: "gift-one" }, { id: "gift-two" }],
      referralCount: bonus ? 0 : 2,
    });
    await page.route("**/api/results", (route) =>
      route.fulfill({
        json:
          route.request().method() === "GET" ? { results: [] } : { ok: true },
      }),
    );
    let requests = 0;
    await page.route(
      bonus ? "**/api/collection/register" : "**/api/collection/rewards/open",
      (route) => {
        requests++;
        state.data = {
          ...state.data,
          firstType: base,
          firstRunId,
          cards: [
            { code: base, source: "first" },
            { code: second, source: "referral" },
          ],
          pending: bonus ? [] : [{ id: "gift-two" }],
        };
        return route.fulfill({
          json: bonus
            ? { outcome: "referred", bonus: second }
            : { code: second },
        });
      },
    );
    if (bonus) await seed(page);
    else {
      await page.goto("/");
      await expect(
        page.getByRole("complementary", { name: "도착한 카드 선물" }),
      ).toContainText("선물 2개 도착");
      await page.getByRole("link", { name: "선물 받으러 가기" }).click();
      await expect(page).toHaveURL(/\/collection#reward-inbox$/);
    }
    if (bonus) await page.goto("/collection");
    await page
      .getByRole("button", {
        name: bonus ? "첫 캐릭터 도감에 저장하기" : "두근두근, 열어보기",
      })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("친구 덕분에, 선물 도착!");
    await expect(dialog).toContainText("닫아도 사라지지 않아요");
    await expect(
      dialog.getByRole("button", { name: "선물 포장 열기" }),
    ).toBeFocused();
    await dialog.screenshot({
      path: testInfo.outputPath(`gift-wrapped-${bonus}.png`),
    });
    if (bonus) await page.emulateMedia({ reducedMotion: "reduce" });
    if (mode === "failed")
      await page.route("**/rewards/card-pack-opening-v1.mp4", (route) =>
        route.abort(),
      );
    await dialog.getByRole("button", { name: "선물 포장 열기" }).click();
    if (mode === "video" || mode === "skip") {
      await expect(dialog).toHaveAttribute("data-phase", "opening");
      await expect
        .poll(() =>
          dialog
            .locator("video")
            .evaluate((clip: HTMLVideoElement) => clip.currentTime),
        )
        .toBeGreaterThan(0.1);
      await dialog.screenshot({
        path: testInfo.outputPath("card-pack-video.png"),
      });
    }
    if (mode === "skip")
      await dialog.getByRole("button", { name: "바로 공개하기" }).click();
    if (!bonus && mode !== "skip") {
      await expect(dialog).toHaveAttribute("data-phase", "rolling");
      await expect
        .poll(async () =>
          Number(
            await dialog.locator("[data-frame]").getAttribute("data-frame"),
          ),
        )
        .toBeGreaterThanOrEqual(3);
    }
    await expect(dialog).toHaveAttribute("data-phase", "revealed");
    await expect(dialog).toContainText("소리, 도감에 합류!");
    await expect
      .poll(() =>
        dialog
          .locator("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await expect(dialog).toContainText("2 / 16");
    await expect(dialog).toContainText(
      bonus ? "다음엔 누가 올까요?" : "1개가 더 기다려요",
    );
    await dialog.screenshot({
      path: testInfo.outputPath(`gift-revealed-${bonus}.png`),
    });
    expect(requests).toBe(1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(
      page.locator(".character-gallery .character-card"),
    ).toHaveCount(2);
    expect(requests).toBe(1);
  });
}

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
  await page.route("**/api/results", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await page.goto("/collection");
  const notebook = page.getByRole("region", { name: "내 도감 관리" });
  await expect(
    notebook.getByRole("button", { name: "로그아웃", exact: true }),
  ).toHaveCount(0);
  await expect(
    notebook.getByRole("button", { name: "계정·도감 삭제", exact: true }),
  ).toHaveCount(0);
  await page.goto("/account");
  await page
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(
    page
      .getByRole("main")
      .getByRole("button", { name: "로그아웃", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await expect(
    page.getByRole("main").getByRole("button", { name: "카카오 로그인" }),
  ).toBeVisible();
  await page.goto("/collection?auth=cancelled");
  await expect(
    page.getByRole("status").filter({ hasText: "로그인을 취소했어요" }),
  ).toBeVisible();
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "다시 불러오기" }),
  ).toBeVisible();
  await page.goto("/quiz");
  await acceptQuizIntro(page);
  await expect(page.locator(".question-number")).toHaveText("질문 01");
});
