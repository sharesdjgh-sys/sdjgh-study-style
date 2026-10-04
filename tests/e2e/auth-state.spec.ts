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

test("상태 조회 실패 시 이전 로그아웃 표시를 숨기고 재시도로 만료된 세션을 확인한다", async ({
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
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    header(page).getByRole("button", { name: "로그인 상태 다시 확인" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "로그아웃", exact: true }),
  ).toHaveCount(0);
  mode = "guest";
  await header(page)
    .getByRole("button", { name: "로그인 상태 다시 확인" })
    .click();
  await expect(
    header(page).getByRole("button", { name: "카카오 로그인" }),
  ).toBeEnabled();
});

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
