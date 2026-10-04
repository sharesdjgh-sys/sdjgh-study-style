import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";

async function emptyResults(context: BrowserContext) {
  await context.route("**/api/results", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await context.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
}
const signedIn = { signedIn: true, configured: true, accountId: "auth-test" };
const guest = { signedIn: false, configured: true };
const header = (page: Page) => page.getByRole("banner");

test("자동 확인 응답을 기다리는 동안에도 로그아웃할 수 있고 늦은 응답이 로그인을 복구하지 않는다", async ({
  page,
  context,
}) => {
  await emptyResults(context);
  let delay = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/api/auth/session", async (route) => {
    requests++;
    if (delay) await gate;
    await route.fulfill({ json: signedIn });
  });
  await page.route("**/api/collection", (route) =>
    route.fulfill({ json: { ...EMPTY_COLLECTION, ...signedIn } }),
  );
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await visit(page, "/account");
  const logout = header(page).getByRole("button", {
    name: "로그아웃",
    exact: true,
  });
  await expect(logout).toBeEnabled();
  delay = true;
  const before = requests;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => requests).toBeGreaterThan(before);
  await expect(logout).toBeEnabled();
  const settled = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url().endsWith("/api/auth/session"),
  });
  await logout.click();
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인", exact: true }),
  ).toBeEnabled();
  release();
  await settled;
  await expect(logout).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "계정·도감 삭제", exact: true }),
  ).toHaveCount(0);
});

test("인증 확인 중에는 로그아웃을 표시하지 않고 도감이 느려도 인증은 먼저 완료한다", async ({
  page,
  context,
}) => {
  await emptyResults(context);
  let releaseSession!: () => void;
  const sessionGate = new Promise<void>((resolve) => {
    releaseSession = resolve;
  });
  let releaseCollection!: () => void;
  const collectionGate = new Promise<void>((resolve) => {
    releaseCollection = resolve;
  });
  await page.route("**/api/auth/session", async (route) => {
    await sessionGate;
    await route.fulfill({ json: signedIn });
  });
  await page.route("**/api/collection", async (route) => {
    await collectionGate;
    await route.fulfill({ json: { ...EMPTY_COLLECTION, ...signedIn } });
  });
  await visit(page, "/collection");
  await expect(
    header(page).getByRole("button", { name: "로그인 확인 중" }),
  ).toBeDisabled();
  await expect(
    header(page).getByRole("button", { name: "로그아웃", exact: true }),
  ).toHaveCount(0);
  releaseSession();
  await expect(
    header(page).getByRole("button", { name: "로그아웃", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("내 도감을 불러오고 있어요.");
  releaseCollection();
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("아직 저장할 첫 검사 결과가 없어요.");
});

test("자동 확인의 일시적 오류는 화면을 유지하고 세션 만료가 확인되면 로그아웃을 반영한다", async ({
  page,
  context,
}) => {
  await emptyResults(context);
  let mode: "signed-in" | "error" | "guest" = "signed-in";
  await page.route("**/api/auth/session", (route) =>
    route.fulfill(
      mode === "error"
        ? { status: 503, json: { error: "unavailable" } }
        : { json: mode === "signed-in" ? signedIn : guest },
    ),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill({ json: { ...EMPTY_COLLECTION, ...signedIn } }),
  );
  await visit(page, "/collection");
  await expect(
    header(page).getByRole("button", { name: "로그아웃", exact: true }),
  ).toBeVisible();
  mode = "error";
  const failed = page.waitForResponse("**/api/auth/session");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect((await failed).status()).toBe(503);
  await expect(
    header(page).getByRole("button", { name: "로그아웃", exact: true }),
  ).toBeEnabled();
  await expect(
    header(page).getByRole("button", { name: "로그인 상태 다시 확인" }),
  ).toHaveCount(0);
  mode = "guest";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인" }),
  ).toBeEnabled();
});

for (const authenticated of [false, true]) {
  test(`${authenticated ? "로그인" : "비로그인"} 화면은 주기·탭 복귀 확인이 지연되어도 로딩으로 바뀌지 않는다`, async ({
    page,
    context,
  }) => {
    await emptyResults(context);
    await page.clock.install();
    const identity = authenticated ? signedIn : guest;
    let gate: Promise<void> | undefined;
    let requests = 0;
    await page.route("**/api/auth/session", async (route) => {
      requests++;
      if (gate) await gate;
      await route.fulfill({ json: identity });
    });
    await page.route("**/api/collection", (route) =>
      route.fulfill({ json: { ...EMPTY_COLLECTION, ...identity } }),
    );
    await visit(page, "/account");
    const button = header(page).getByRole("button", {
      name: authenticated ? "로그아웃" : "카카오 로그인",
      exact: true,
    });
    await expect(button).toBeEnabled();
    await expect(
      page.getByText("검사 기록을 확인하고 있어요…", { exact: true }),
    ).toHaveCount(0);
    for (const trigger of ["timer", "focus"]) {
      let release!: () => void;
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const before = requests;
      const response = page.waitForResponse("**/api/auth/session");
      if (trigger === "timer") await page.clock.fastForward(30000);
      else await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect.poll(() => requests).toBeGreaterThan(before);
      await page.clock.fastForward(5200);
      await expect(button).toBeEnabled();
      await expect(button).toHaveAttribute("aria-busy", "false");
      await expect(header(page)).not.toContainText("확인 중");
      await expect(header(page)).not.toContainText("평소보다 오래");
      await expect(
        page.getByText("검사 기록을 확인하고 있어요…", { exact: true }),
      ).toHaveCount(0);
      release();
      await response;
      gate = undefined;
      await expect(button).toBeEnabled();
    }
  });
}

test("로그아웃 성공 즉시 계정 화면을 비우고 다른 탭에도 반영한다", async ({
  page,
  context,
}) => {
  await emptyResults(context);
  let loggedIn = true;
  let failSession = false;
  await context.route("**/api/auth/session", (route) =>
    route.fulfill(
      failSession
        ? { status: 503, json: {} }
        : { json: loggedIn ? signedIn : guest },
    ),
  );
  await context.route("**/api/collection", (route) =>
    route.fulfill({
      json: { ...EMPTY_COLLECTION, ...(loggedIn ? signedIn : guest) },
    }),
  );
  await context.route("**/api/auth/logout", (route) => {
    loggedIn = false;
    failSession = true;
    return route.fulfill({ json: { ok: true } });
  });
  await visit(page, "/collection?auth=success");
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("카카오 로그인이 완료됐어요.");
  const other = await context.newPage();
  await visit(other, "/collection");
  await expect(
    header(other).getByRole("button", { name: "로그아웃", exact: true }),
  ).toBeVisible();
  await header(page)
    .getByRole("button", { name: "로그아웃", exact: true })
    .click();
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "계정·도감 삭제" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).not.toContainText("카카오 로그인이 완료됐어요.");
  await expect(
    header(other).getByRole("button", { name: "로그인 상태 다시 확인" }),
  ).toBeVisible();
  await expect(
    other.getByRole("button", { name: "로그아웃", exact: true }),
  ).toHaveCount(0);
});

test("로그인 시작 진행·지연·실패를 표시하고 뒤로 복원되면 다시 확인한다", async ({
  page,
}) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: guest }),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/api/auth/kakao/start", async (route) => {
    requests++;
    expect(route.request().headers().accept).toContain("application/json");
    await gate;
    await route.fulfill({ status: 503, json: { error: "unavailable" } });
  });
  await visit(page, "/collection");
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인" }),
  ).toBeEnabled();
  await page.clock.install();
  await header(page).getByRole("button", { name: "카카오 로그인" }).click();
  await expect(
    header(page).getByRole("button", { name: "카카오로 이동 중" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("카카오 로그인 화면으로 이동하고 있어요");
  await page.clock.runFor(5200);
  await expect(header(page)).toContainText("평소보다 오래 걸리고 있어요");
  expect(requests).toBe(1);
  release();
  await expect(header(page)).toContainText("로그인을 시작하지 못했어요");
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("로그인을 시작하지 못했어요");
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인" }),
  ).toBeEnabled();
  await expect(header(page)).not.toContainText("로그인을 시작하지 못했어요");
});

test("성공 URL만으로 로그인 성공을 표시하지 않고 재가입 제한 시각을 안내한다", async ({
  page,
}) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: guest }),
  );
  await visit(page, "/collection?auth=success");
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인" }),
  ).toBeVisible();
  await expect(
    page.getByText("카카오 로그인이 완료됐어요.", { exact: false }),
  ).toHaveCount(0);
  await visit(
    page,
    "/collection?auth=rejoin_blocked&retryAt=2030-01-08T00%3A00%3A00.000Z",
  );
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("탈퇴 후 7일 동안은 다시 가입할 수 없어요.");
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("한국 시간");
});

test("재가입자는 초대 코드 입력 대신 보상 제외 안내를 본다", async ({
  page,
  context,
}) => {
  await emptyResults(context);
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: signedIn }),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: { ...EMPTY_COLLECTION, ...signedIn, referralEligible: false },
    }),
  );
  await visit(page, "/");
  await page.evaluate(
    ({ version, answers, index }) => {
      const now = Date.now();
      const session = {
        version,
        answers,
        index,
        runId: crypto.randomUUID(),
        source: "direct",
        startedAt: now,
        updatedAt: now,
        completedAt: now,
        choices: {},
        result: "visual-solo-planned",
      };
      localStorage.setItem("study-style:session", JSON.stringify(session));
      localStorage.setItem("study-style:first-result", JSON.stringify(session));
    },
    {
      version: VERSION,
      answers: answersFor("visual-solo-planned"),
      index: QUESTIONS.length - 1,
    },
  );
  await visit(page, "/collection");
  await expect(
    page.getByRole("region", { name: "내 도감 관리" }),
  ).toContainText("재가입 계정은 신규 가입 초대 보상 대상이 아니에요.");
  await expect(page.getByPlaceholder("10자리 초대 코드")).toHaveCount(0);
});

async function visit(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
}
