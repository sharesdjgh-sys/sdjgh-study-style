import { test, expect, type Page } from "@playwright/test";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { EMPTY_SKILLS } from "../../src/lib/skill-economy";
import { EMPTY_GOODS } from "../../src/lib/goods";
import { CHARACTERS } from "../../src/lib/characters";
import {
  defaultAdminRange,
  daysBefore,
  type AdminStats,
  type AdminAccount,
} from "../../src/lib/admin-contract";

const id = "123e4567-e89b-42d3-a456-426614174000";
const row: AdminAccount = {
  id,
  createdAt: "2026-10-01T00:00:00Z",
  registeredAt: "2026-10-01T01:00:00Z",
  firstType: "visual-solo-planned",
  opened: 3,
  pending: 1,
  skills: 4,
  completed: 2,
  goods: 1,
  hearts: 2,
  stars: 3,
};
const sample: AdminStats = {
  generatedAt: "2026-10-14T01:00:00Z",
  range: defaultAdminRange(),
  totals: [
    { label: "전체 계정", value: 52, unit: "계정" },
    { label: "도감 등록", value: 40, unit: "계정" },
    { label: "개봉 카드", value: 120, unit: "장" },
    { label: "16종 완성", value: 2, unit: "계정" },
    { label: "실천 완료", value: 25, unit: "건" },
    { label: "굿즈 보유", value: 12, unit: "개" },
  ],
  reports: [
    {
      id: "participation",
      title: "검사 참여 추이",
      basis: "기간 내 검사 시작일 기준",
      columns: [
        { key: "day", label: "시작일" },
        { key: "starts", label: "시작 건수" },
        { key: "completions", label: "완료 건수" },
        { key: "rate", label: "완료율 (%)" },
      ],
      rows: [
        { day: defaultAdminRange(1).to, starts: 20, completions: 15, rate: 75 },
      ],
      chart: { label: "day", value: "starts" },
    },
    {
      id: "activity",
      title: "가입·등록·수집 추이",
      basis: "기간 내 발생일 기준",
      columns: [
        { key: "day", label: "날짜" },
        { key: "accounts", label: "신규 계정" },
      ],
      rows: [
        ...[12, 10, 7, 5, 3, 1, 0].map((offset, i) => ({
          day: daysBefore(defaultAdminRange(1).to, offset),
          accounts: [3, 5, 2, 8, 4, 6, 2][i],
          registrations: [2, 3, 1, 6, 3, 4, 2][i],
          cards: [4, 8, 3, 12, 6, 10, 5][i],
          goods: [0, 1, 0, 2, 1, 3, 1][i],
        })),
        {
          day: daysBefore(defaultAdminRange(1).to, 2),
          accounts: 0,
          registrations: 0,
          cards: 0,
          goods: 0,
        },
      ],
    },
    {
      id: "characters",
      title: "첫 캐릭터와 카드 보유",
      basis: "현재 상태",
      columns: [
        { key: "name", label: "캐릭터" },
        { key: "firsts", label: "첫 캐릭터 계정 수" },
      ],
      rows: [
        "visual-solo-planned",
        "auditory-solo-flexible",
        "motion-team-flexible",
        "tactile-solo-planned",
      ].map((code, i) => ({
        code,
        name: CHARACTERS[code].name,
        firsts: [16, 12, 8, 4][i],
        owners: [28, 20, 14, 10][i],
        pending: [2, 0, 1, 0][i],
        share: [40, 30, 20, 10][i],
      })),
      chart: { label: "name", value: "firsts" },
    },
    {
      id: "distribution",
      title: "카드 수집량 분포",
      basis: "현재 상태 · 도감 등록 계정 기준",
      columns: [
        { key: "cards", label: "카드 수" },
        { key: "accounts", label: "계정 수" },
      ],
      rows: [
        [0, 4],
        [1, 12],
        [2, 0],
        [3, 16],
        [4, 2],
        [5, 4],
        [16, 2],
      ].map(([cards, accounts]) => ({ cards, accounts })),
    },
    {
      id: "skills",
      title: "스킬 해금과 실천",
      basis: "실천 시작일 기준",
      columns: [
        { key: "name", label: "스킬" },
        { key: "completions", label: "실천 완료" },
      ],
      rows: [
        { name: "빈 종이 회상법", completions: 12, starts: 18, owners: 24 },
        { name: "간격 두고 복습하기", completions: 8, starts: 12, owners: 18 },
        { name: "질문 만들기", completions: 5, starts: 9, owners: 12 },
        { name: "미사용 스킬", completions: 0, starts: 0, owners: 0 },
      ],
    },
    {
      id: "goods",
      title: "굿즈 교환 현황",
      basis: "선택 기간",
      columns: [
        { key: "kind", label: "종류" },
        { key: "exchanges", label: "기간 내 교환 수" },
      ],
      rows: [
        {
          kind: "모션",
          name: "루미의 공부 시간",
          code: "visual-solo-planned",
          character: "루미",
          exchanges: 3,
          owners: 5,
        },
      ],
    },
  ],
};
async function setup(page: Page, mode: "admin" | "guest" | "member" = "admin") {
  const state = { mode, statsError: false };
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json:
        state.mode === "guest"
          ? { signedIn: false, configured: true }
          : {
              signedIn: true,
              configured: true,
              accountId: id,
              isAdmin: state.mode === "admin",
            },
    }),
  );
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        configured: true,
        signedIn: state.mode !== "guest",
        accountId: id,
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
    route.fulfill({ json: EMPTY_SKILLS }),
  );
  await page.route("**/api/goods", (route) =>
    route.fulfill({ json: EMPTY_GOODS }),
  );
  await page.route("**/api/admin/stats?*", (route) => {
    const p = new URL(route.request().url()).searchParams;
    return route.fulfill(
      state.statsError
        ? { status: 503, json: { error: "unavailable" } }
        : {
            json: {
              ...sample,
              range: { from: p.get("from"), to: p.get("to") },
            },
          },
    );
  });
  await page.route("**/api/admin/accounts?*", (route) => {
    const p = new URL(route.request().url()).searchParams;
    return route.fulfill({
      json: {
        generatedAt: sample.generatedAt,
        total: p.get("q") ? 1 : 52,
        page: Number(p.get("page")),
        pageSize: 50,
        rows: [
          { ...row, id: p.get("page") === "2" ? id.replace(/0$/, "1") : id },
        ],
      },
    });
  });
  await page.route("**/api/admin/accounts/" + id, (route) =>
    route.fulfill({
      json: {
        generatedAt: sample.generatedAt,
        account: row,
        cards: [
          { code: "visual-solo-planned", openedAt: row.registeredAt },
          { code: "motion-team-flexible", openedAt: null },
        ],
        skills: ["outline"],
        goods: ["visual-solo-planned--motion-01"],
      },
    }),
  );
  await page.route("**/api/admin/export?*", (route) =>
    route.fulfill({
      contentType: "text/csv; charset=utf-8",
      body: '\uFEFF"계정 ID","개봉 카드"\r\n"' + id + '","3"\r\n',
    }),
  );
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  return state;
}
test("관리자 화면의 지표·기간·탭을 조회하고 모바일에서도 화면 폭을 유지한다", async ({
  page,
}, testInfo) => {
  await setup(page);
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "빠른 메뉴" })).toHaveCount(
    0,
  );
  await expect
    .poll(() =>
      page
        .locator("main img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("admin-overview.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("navigation", { name: "관리자 통계 메뉴" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "검사 참여", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "검사 참여 추이" }),
  ).toBeVisible();
  const request = page.waitForRequest(
    (r) =>
      r.url().includes("/api/admin/stats?") &&
      new URL(r.url()).searchParams.get("from") === defaultAdminRange(7).from,
  );
  await page.getByRole("button", { name: "7일", exact: true }).click();
  await request;
  await expect(page.getByText("완료율 75%")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "75", exact: true }),
  ).toBeHidden();
  await page.getByText("상세 데이터 · 1개 항목", { exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "75", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "캐릭터·카드", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "첫 캐릭터와 카드 보유" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: CHARACTERS["visual-solo-planned"].name,
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("admin-characters.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "스킬·굿즈", exact: true }).click();
  await expect(page.getByText("루미 · 모션", { exact: true })).toBeVisible();
  await expect(page.getByText("미사용 스킬", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("admin-skills.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
test("계정 검색·페이지·상세·CSV 다운로드를 제공한다", async ({ page }) => {
  await setup(page);
  await page.getByRole("button", { name: "계정별 현황", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "계정 52개", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByText("2 / 2 페이지")).toBeVisible();
  const search = page.getByRole("textbox", { name: "계정 ID 검색" });
  await search.fill(id);
  await search.press("Enter");
  await expect(
    page.getByRole("heading", { name: "계정 1개", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: id + " 상세 보기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "16종 카드 수집 상태" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "선택 계정 상세" }),
  ).toContainText("미개봉 선물");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV 다운로드", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "studycrew-accounts.csv",
  );
});
for (const mode of ["guest", "member"] as const)
  test(mode + " 사용자는 통계를 표시하지 않는다", async ({ page }) => {
    let reads = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/admin/")) reads++;
    });
    await setup(page, mode);
    await expect(
      page.getByRole("heading", {
        name:
          mode === "guest"
            ? "관리자 계정으로 로그인해 주세요"
            : "접근 권한을 확인해 주세요",
      }),
    ).toBeVisible();
    expect(reads).toBe(0);
    const api = await page.request.get("/api/admin/stats");
    expect(api.status()).toBe(401);
  });
test("DB 오류를 0으로 표시하지 않고 재시도한다", async ({ page }) => {
  const state = await setup(page);
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toBeVisible();
  state.statsError = true;
  await page.getByRole("button", { name: "새로고침", exact: true }).click();
  await expect(
    page.getByText("불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toHaveCount(0);
  state.statsError = false;
  await page
    .getByRole("button", { name: "다시 불러오기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toBeVisible();
});
test("권한 회수나 세션 만료 후 관리 데이터를 제거한다", async ({ page }) => {
  const state = await setup(page);
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toBeVisible();
  state.mode = "member";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "접근 권한을 확인해 주세요" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toHaveCount(0);
  state.mode = "guest";
  await page
    .getByRole("button", { name: "권한 다시 확인", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "관리자 계정으로 로그인해 주세요" }),
  ).toBeVisible();
});
test("API의 권한 거부가 확인되면 기존 지표와 다운로드 버튼을 숨긴다", async ({
  page,
}) => {
  await setup(page);
  await expect(
    page.getByRole("heading", { name: "현재 전체 현황" }),
  ).toBeVisible();
  await page.route("**/api/admin/stats?*", (route) =>
    route.fulfill({ status: 403, json: { error: "forbidden" } }),
  );
  await page.getByRole("button", { name: "새로고침", exact: true }).click();
  await expect(
    page.getByText(
      "관리자 권한이 없거나 로그인이 만료되었어요. 다시 확인해 주세요.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "CSV 다운로드" })).toHaveCount(
    0,
  );
});

test("늦게 도착한 계정 상세 응답이 로그아웃 후 데이터를 복구하지 않는다", async ({
  page,
}) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "계정별 현황", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "계정 52개", exact: true }),
  ).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/admin/accounts/" + id, async (route) => {
    await gate;
    await route
      .fulfill({
        json: {
          generatedAt: sample.generatedAt,
          account: row,
          cards: [],
          skills: [],
          goods: [],
        },
      })
      .catch(() => {});
  });
  const requested = page.waitForRequest((r) =>
    r.url().endsWith("/api/admin/accounts/" + id),
  );
  await page
    .getByRole("button", { name: id + " 상세 보기", exact: true })
    .click();
  await requested;
  state.mode = "guest";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "관리자 계정으로 로그인해 주세요" }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("region", { name: "선택 계정 상세" }),
  ).toHaveCount(0);
  await expect(page.getByRole("region", { name: "계정 목록" })).toHaveCount(0);
});

test("0건 날짜를 생략하고 의미 있는 0장 계정과 지표별 기록을 보존한다", async ({
  page,
}) => {
  await setup(page);
  const activity = page.getByRole("region", {
    name: "가입·등록·수집 추이",
    exact: true,
  });
  await expect(
    activity.getByRole("region", { name: "가입·등록·수집 추이 그래프" }),
  ).toBeVisible();
  await expect(
    activity.locator(
      '[aria-label^="' + daysBefore(defaultAdminRange(1).to, 2) + ':"]',
    ),
  ).toHaveCount(0);
  await activity
    .getByRole("button", { name: "굿즈 교환", exact: true })
    .click();
  await expect(activity.getByText("기록이 있는")).toContainText("5일");
  const distribution = page.getByRole("region", {
    name: "카드 수집량 분포",
    exact: true,
  });
  await expect(
    distribution.getByLabel("0장: 4계정", { exact: true }),
  ).toBeVisible();
  await expect(
    distribution.getByLabel("2장: 0계정", { exact: true }),
  ).toHaveCount(0);
});
test("빈 통계에는 빈 축과 순위 대신 안내를 표시한다", async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.route("**/api/admin/stats?*", (route) =>
    route.fulfill({
      json: {
        ...sample,
        totals: sample.totals.map((m) => ({ ...m, value: 0 })),
        reports: sample.reports.map((r) => ({ ...r, rows: [] })),
      },
    }),
  );
  await page.getByRole("button", { name: "새로고침", exact: true }).click();
  await expect(
    page.getByText("신규 가입 기록이 아직 없어요.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "가입·등록·수집 추이 그래프" }),
  ).toHaveCount(0);
  await expect(page.getByText(/상세 데이터 ·/)).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("admin-empty.png"),
    fullPage: true,
  });
});

test("1년·전체·90일 이전 직접 조회와 월별 차트를 지원한다", async ({
  page,
}, testInfo) => {
  await setup(page);
  const seen: string[] = [];
  await page.route("**/api/admin/stats?*", (route) => {
    const p = new URL(route.request().url()).searchParams;
    seen.push(p.get("from")!);
    return route.fulfill({
      json: {
        ...sample,
        range: { from: p.get("from"), to: p.get("to") },
        reports: sample.reports.map((r) =>
          r.id === "activity"
            ? {
                ...r,
                timeUnit: "month",
                rows:
                  p.get("from") === "2024-12-15"
                    ? [
                        { day: "2024-12-01", accounts: 4 },
                        { day: "2025-01-01", accounts: 5 },
                      ]
                    : [
                        { day: "2025-11-01", accounts: 4 },
                        { day: "2026-01-01", accounts: 5 },
                      ],
              }
            : r,
        ),
      },
    });
  });
  await page.getByRole("button", { name: "1년", exact: true }).click();
  const activity = page.getByRole("region", {
    name: "가입·등록·수집 추이",
    exact: true,
  });
  await expect(activity.getByText("월별 신규 가입 비교")).toBeVisible();
  await expect(activity.getByText("2개월", { exact: true })).toBeVisible();
  await expect(
    activity.getByLabel("2025-11: 4계정", { exact: true }),
  ).toBeVisible();
  expect(seen).toContain(defaultAdminRange(365).from);
  await page.getByRole("button", { name: "전체", exact: true }).click();
  await expect(page.getByText(/보관된 전체 기간 —/)).toBeVisible();
  await expect.poll(() => seen.includes("0001-01-01")).toBe(true);
  await page.getByText("기간 직접 선택", { exact: true }).click();
  await page.getByLabel("시작일", { exact: true }).fill("2024-12-15");
  await page.getByLabel("종료일", { exact: true }).fill("2025-04-10");
  await page.getByRole("button", { name: "기간 적용", exact: true }).click();
  await expect.poll(() => seen.includes("2024-12-15")).toBe(true);
  await expect(
    activity.getByLabel("2024-12: 4계정", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("admin-monthly.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
