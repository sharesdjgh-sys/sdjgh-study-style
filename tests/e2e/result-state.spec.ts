import { test, expect, type Page } from "@playwright/test";
import { QUESTIONS, VERSION, getType } from "../../src/lib/content";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import type { Session } from "../../src/lib/storage";
import { answersFor } from "../answers";
import sharp from "sharp";

for (const signedIn of [false, true]) {
  test(`${signedIn ? "로그인" : "비로그인"} 재검사 화면에서도 최초 캐릭터 카드를 다운로드한다`, async ({
    page,
  }) => {
    const first = completed("visual-solo-planned", 30000);
    const latest = completed("motion-team-flexible", 1000, true);
    await api(page, [latest, first], signedIn, first.runId);
    if (!signedIn) await device(page, first, latest);
    await visit(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      getType(latest.result!)!.name,
    );
    await page.getByRole("link", { name: "내 캐릭터 카드 저장" }).click();
    await page
      .getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveAccessibleName(
      "나의 루미 카드",
    );
    await expect(page.locator(".keepsake-preview")).toHaveAttribute(
      "alt",
      /루미.*시각형 100%.*운동형 0%/,
    );
    const pending = page.waitForEvent("download");
    await page.getByRole("link", { name: "이미지 저장", exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toContain("루미");
    const metadata = await sharp((await download.path())!).metadata();
    expect([metadata.width, metadata.height, metadata.format]).toEqual([
      1080,
      1920,
      "png",
    ]);
  });
}

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /same key|hydration|cannot update|invalid|uncaught/i.test(message.text())
    )
      errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

function completed(
  code = "visual-solo-planned",
  age = 0,
  isRetake = false,
): Session {
  const time = Date.now() - age;
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    source: "direct",
    startedAt: time,
    updatedAt: time,
    completedAt: time,
    answers: answersFor(code),
    choices: {},
    index: QUESTIONS.length - 1,
    result: code,
    isRetake,
  };
}
async function device(page: Page, first: Session, latest = first) {
  await page.addInitScript(
    ({ first, latest }) => {
      localStorage.setItem("study-style:first-result", JSON.stringify(first));
      localStorage.setItem("study-style:session", JSON.stringify(latest));
    },
    { first, latest },
  );
}
async function api(
  page: Page,
  results: Session[],
  signedIn = true,
  firstRunId: string | null = results.at(-1)?.runId ?? null,
) {
  const identity = {
    signedIn,
    configured: true,
    ...(signedIn ? { accountId: "result-owner" } : {}),
  };
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: identity }),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        ...identity,
        firstRunId,
        firstType: results.find((s) => s.runId === firstRunId)?.result ?? null,
      },
    }),
  );
  await page.route("**/api/results", (route) =>
    route.fulfill({
      json: route.request().method() === "GET" ? { results } : { ok: true },
    }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
}
const visit = (page: Page, url = "/result") =>
  page.goto(url, { waitUntil: "domcontentloaded" });

test("계정 전환 중에는 이전 기록을 숨기고 도감 오류가 있어도 현재 계정 결과만 표시한다", async ({
  page,
}) => {
  const a = completed("visual-solo-planned", 10000);
  const b = completed("auditory-team-planned");
  await device(page, a);
  let owner = "a";
  let collectionFails = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: { signedIn: true, configured: true, accountId: owner },
    }),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill(
      collectionFails
        ? { status: 503, json: { error: "unavailable" } }
        : {
            json: {
              ...EMPTY_COLLECTION,
              signedIn: true,
              configured: true,
              accountId: owner,
              firstRunId: (owner === "a" ? a : b).runId,
              firstType: (owner === "a" ? a : b).result,
            },
          },
    ),
  );
  await page.route("**/api/results", async (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({ status: 409, json: { error: "run_conflict" } });
    const requestedOwner = owner;
    if (requestedOwner === "b") await gate;
    return route.fulfill({
      json: { results: [requestedOwner === "a" ? a : b] },
    });
  });
  await visit(page);
  await expect(page.locator(".character-name")).toHaveText("루미");
  owner = "b";
  collectionFails = true;
  await page.evaluate(() =>
    dispatchEvent(
      new StorageEvent("storage", {
        key: "study-style:auth-changed",
        newValue: "changed",
      }),
    ),
  );
  await expect(page.locator(".character-name")).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    getType(b.result!)!.name,
  );
  await expect(page.locator(".character-card")).toHaveCount(0);
  await expect(page.locator(".keepsake-section")).not.toContainText("루미");
  await expect(
    page.getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "도감 다시 확인" }),
  ).toBeVisible();
  collectionFails = false;
  await page.getByRole("button", { name: "도감 다시 확인" }).click();
  await expect(page.locator(".character-card")).toHaveCount(1);
  await expect(page.locator(".character-name")).not.toHaveText("루미");
});

test("비로그인 중 진행 중인 재검사가 있어도 최초 완료 결과를 열고 없는 기록은 구분한다", async ({
  page,
}) => {
  const first = completed();
  await api(page, [], false);
  await device(page, first, {
    ...completed(),
    result: null,
    completedAt: undefined,
    isRetake: true,
  });
  await visit(page);
  await expect(page.locator(".character-name")).toHaveText("루미");
  await visit(page, `/result?run=${first.runId}`);
  await expect(page.locator(".character-name")).toHaveText("루미");
  await visit(page, `/result?run=${crypto.randomUUID()}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "요청한 검사 기록을 찾을 수 없어요.",
  );
  await expect(
    page
      .getByRole("main")
      .getByRole("button", { name: "카카오 로그인", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "최근 결과 보기" }).click();
  await expect(page.locator(".character-name")).toHaveText("루미");
});

test("계정의 최신 결과가 오래된 기기 결과보다 우선하고 기록 전환 시 카드·공부법도 바뀐다", async ({
  page,
  isMobile,
}, info) => {
  const first = completed("visual-solo-planned", 30000);
  const latest = completed("motion-team-flexible", 1000, true);
  await api(page, [first, latest], true, first.runId);
  await device(page, first);
  await visit(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    getType(latest.result!)!.name,
  );
  await expect(page.locator(".mystery-card")).toHaveCount(1);
  await expect(page.locator(".character-card")).toHaveCount(0);
  await page
    .getByLabel("검사 기록 선택", { exact: true })
    .selectOption(first.runId);
  await expect(page.locator(".character-name")).toHaveText("루미");
  await expect(page.locator("#study-methods-title")).toHaveText(
    "루미의 공부법 도구함",
  );
  await expect(
    page.getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => scrollTo({ top: 0, left: 0, behavior: "instant" }));
  expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
  await page.screenshot({ path: info.outputPath("result-hero.png") });
  await page.screenshot({
    path: info.outputPath(`result-${isMobile ? "mobile" : "desktop"}.png`),
    fullPage: true,
  });
  await page
    .getByLabel("검사 기록 선택", { exact: true })
    .selectOption(latest.runId);
  await expect(page.locator("#study-methods-title")).toHaveText(
    "이 유형의 공부법 도구함",
  );
  await expect(
    page.getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "지금 10분 해보기", exact: true })
    .click();
  await expect(page.getByRole("timer")).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("study-style:session")!).mission,
    ),
  ).toBeUndefined();
});

test("서버 결과 조회 실패는 빈 결과로 취급하지 않고 재시도로 복구한다", async ({
  page,
}) => {
  const first = completed();
  await api(page, [first], true, null);
  let failing = true;
  await page.route("**/api/results", (route) =>
    route.fulfill(
      failing
        ? { status: 503, json: { error: "unavailable" } }
        : { json: { results: [first] } },
    ),
  );
  await visit(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "검사 기록을 확인하지 못했어요.",
  );
  failing = false;
  await page
    .getByRole("button", { name: "결과 저장·불러오기 다시 시도" })
    .click();
  await expect(page.locator(".character-name")).toHaveText("루미");
});

test("기기 첫 결과의 계정 충돌이 새 검사 저장을 막지 않고 충돌 결과를 노출하지 않는다", async ({
  page,
}) => {
  const foreign = completed("visual-solo-planned", 10000);
  const fresh = completed("motion-team-flexible", 0, true);
  const stored: Session[] = [];
  const posted: string[] = [];
  await api(page, stored, true, null);
  await device(page, foreign, fresh);
  await page.route("**/api/results", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { results: stored } });
    const value = route.request().postDataJSON() as Session;
    posted.push(value.runId);
    if (value.runId === foreign.runId)
      return route.fulfill({ status: 409, json: { error: "run_conflict" } });
    stored.push(value);
    return route.fulfill({ json: { ok: true } });
  });
  await visit(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    getType(fresh.result!)!.name,
  );
  expect(posted).toEqual([foreign.runId, fresh.runId]);
  await expect(page.locator(".keepsake-section")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "계정에 저장한 검사 결과" }),
  ).toContainText("다른 계정에 저장됐거나");
  await visit(page, `/result?run=${foreign.runId}`);
  await expect(page.locator(".character-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "요청한 검사 기록을 찾을 수 없어요.",
  );
});

test("새 기기의 로그인 사용자는 하단 내 결과로 이동하고 로그아웃하면 서버 기록이 사라진다", async ({
  page,
  isMobile,
}) => {
  const first = completed();
  await api(page, [first]);
  let loggedIn = true;
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: loggedIn
        ? { signedIn: true, configured: true, accountId: "result-owner" }
        : { signedIn: false, configured: true },
    }),
  );
  await page.route("**/api/auth/logout", (route) => {
    loggedIn = false;
    return route.fulfill({ json: { ok: true } });
  });
  await visit(page);
  await expect(page.locator(".character-name")).toHaveText("루미");
  if (isMobile)
    await expect(
      page
        .getByRole("navigation", { name: "빠른 메뉴", exact: true })
        .getByRole("link", { name: "내 결과", exact: true }),
    ).toBeVisible();
  await page
    .getByRole("banner")
    .getByRole("button", { name: "로그아웃", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "아직 완료한 검사 결과가 없어요.",
  );
  await expect(page.locator(".character-card")).toHaveCount(0);
});
