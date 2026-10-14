import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), query: vi.fn() }));
vi.mock("@/lib/collection-server", () => ({
  account: () => mocks.account(),
  loginConfigured: () => true,
  json: (data: unknown, status = 200) =>
    Response.json(data, {
      status,
      headers: { "Cache-Control": "no-store", Vary: "Cookie" },
    }),
}));
vi.mock("@/lib/db", () => ({ database: () => ({ query: mocks.query }) }));
import { GET as session } from "../../src/app/api/auth/session/route";
import { GET as stats } from "../../src/app/api/admin/stats/route";
import { GET as accounts } from "../../src/app/api/admin/accounts/route";
import { GET as detail } from "../../src/app/api/admin/accounts/[id]/route";
import { GET as download } from "../../src/app/api/admin/export/route";
const id = "123e4567-e89b-42d3-a456-426614174000";
const request = (path: string) => new Request("https://study.example" + path);
const params = { params: Promise.resolve({ id }) };
const accountRow = {
  id,
  createdAt: "2026-10-01T00:00:00Z",
  registeredAt: null,
  firstType: null,
  opened: 0,
  pending: 0,
  skills: 0,
  completed: 0,
  goods: 0,
  hearts: 0,
  stars: 0,
};
const rawStats = () => ({
  generatedAt: "2026-10-14T00:00:00Z",
  summary: {
    accounts: 1,
    registered: 0,
    cards: 0,
    pending: 0,
    complete: 0,
    average: 0,
    practices: 0,
    goods: 0,
  },
  participation: [{ day: "2026-10-14", starts: 2, completions: 1 }],
  sources: [],
  activity: [],
  characters: [],
  distribution: [],
  skills: [],
  goods: [],
});
beforeEach(() => {
  vi.stubEnv("ADMIN_ACCOUNT_IDS", id);
  mocks.account.mockReset();
  mocks.query.mockReset();
  mocks.account.mockResolvedValue({ id });
});
afterEach(() => vi.unstubAllEnvs());
const protectedRequests = () => [
  () => stats(request("/api/admin/stats")),
  () => accounts(request("/api/admin/accounts")),
  () => detail(request("/api/admin/accounts/" + id), params),
  () => download(request("/api/admin/export?report=accounts")),
  () => download(request("/api/admin/export?report=overview")),
];
it("비로그인과 일반 계정은 모든 조회·다운로드 경로에서 차단한다", async () => {
  for (const [owner, status] of [
    [null, 401],
    [{ id: "223e4567-e89b-42d3-a456-426614174000" }, 403],
  ] as const) {
    mocks.account.mockResolvedValue(owner);
    for (const call of protectedRequests()) {
      const response = await call();
      expect(response.status).toBe(status);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
  }
  expect(mocks.query).not.toHaveBeenCalled();
});
it("허용 목록 회수와 세션 만료는 다음 요청에서 즉시 반영된다", async () => {
  mocks.query.mockResolvedValue([
    { data: { total: 1, rows: [accountRow], generatedAt: "now" } },
  ]);
  expect((await accounts(request("/api/admin/accounts"))).status).toBe(200);
  vi.stubEnv("ADMIN_ACCOUNT_IDS", "");
  expect((await accounts(request("/api/admin/accounts"))).status).toBe(403);
  mocks.account.mockResolvedValue(null);
  expect(
    (await download(request("/api/admin/export?report=accounts"))).status,
  ).toBe(401);
});
it("클라이언트 관리자 헤더·쿼리를 보내도 일반 계정 권한은 바뀌지 않는다", async () => {
  mocks.account.mockResolvedValue({
    id: "223e4567-e89b-42d3-a456-426614174000",
  });
  const response = await stats(
    new Request("https://study.example/api/admin/stats?isAdmin=true", {
      headers: { "X-Admin": "true" },
    }),
  );
  expect(response.status).toBe(403);
  expect(mocks.query).not.toHaveBeenCalled();
});
it("입력 오류·삭제 계정·DB 오류를 구분하고 원문 오류는 노출하지 않는다", async () => {
  expect((await accounts(request("/api/admin/accounts?page=0"))).status).toBe(
    400,
  );
  expect((await stats(request("/api/admin/stats?from=bad"))).status).toBe(400);
  expect(
    (
      await detail(request("/api/admin/accounts/bad"), {
        params: Promise.resolve({ id: "bad" }),
      })
    ).status,
  ).toBe(400);
  mocks.query.mockResolvedValue([]);
  expect(
    (await detail(request("/api/admin/accounts/" + id), params)).status,
  ).toBe(404);
  mocks.query.mockRejectedValue(Error("postgres://secret"));
  const failure = await stats(request("/api/admin/stats"));
  expect(failure.status).toBe(503);
  expect(await failure.text()).not.toContain("secret");
});
it("화면 통계와 CSV는 같은 집계와 완료율을 사용한다", async () => {
  mocks.query.mockResolvedValue([{ data: rawStats() }]);
  const response = await stats(request("/api/admin/stats"));
  const data = await response.json();
  expect(data.reports[0].rows[0].rate).toBe(50);
  const csv = await download(request("/api/admin/export?report=participation"));
  expect(csv.status).toBe(200);
  expect(csv.headers.get("Content-Type")).toContain("text/csv");
  expect(csv.headers.get("Cache-Control")).toBe("no-store");
  expect(await csv.text()).toContain('"2026-10-14","2","1","50"');
});
it("계정 CSV는 화면 페이지와 무관하게 필터 전체를 내보내고 초과 시 거부한다", async () => {
  mocks.query.mockResolvedValue([
    { data: { total: 1, rows: [accountRow], generatedAt: "now" } },
  ]);
  const csv = await download(
    request(
      "/api/admin/export?report=accounts&page=5&sort=cards&status=unregistered",
    ),
  );
  expect(csv.status).toBe(200);
  expect(mocks.query.mock.calls[0][1]).toEqual([
    "",
    "",
    "unregistered",
    "cards",
    10001,
    0,
  ]);
  const text = await csv.text();
  expect(text).toContain(id);
  expect(text).toContain("미등록");
  mocks.query.mockResolvedValue([
    { data: { total: 10001, rows: [], generatedAt: "now" } },
  ]);
  const response = await download(request("/api/admin/export?report=accounts"));
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({ error: "export_too_large" });
});

it("인증 세션은 서버에서 확인한 관리자에게만 메뉴 권한을 제공한다", async () => {
  expect(await (await session()).json()).toEqual({
    signedIn: true,
    configured: true,
    accountId: id,
    isAdmin: true,
  });
  vi.stubEnv("ADMIN_ACCOUNT_IDS", "");
  expect(await (await session()).json()).toEqual({
    signedIn: true,
    configured: true,
    accountId: id,
  });
  expect(mocks.query).not.toHaveBeenCalled();
});

it("통계 API와 CSV에서 빈 날짜를 제외하되 미완료 검사는 유지한다", async () => {
  mocks.query.mockResolvedValue([
    {
      data: {
        ...rawStats(),
        participation: [
          { day: "2026-10-12", starts: 0, completions: 0 },
          { day: "2026-10-13", starts: 2, completions: 0 },
          { day: "2026-10-14", starts: 2, completions: 1 },
        ],
      },
    },
  ]);
  const response = await stats(request("/api/admin/stats"));
  const data = await response.json();
  expect(data.reports[0].rows.map((row: { day: string }) => row.day)).toEqual([
    "2026-10-13",
    "2026-10-14",
  ]);
  const csv = await (
    await download(request("/api/admin/export?report=participation"))
  ).text();
  expect(csv).not.toContain('"2026-10-12","0","0","0"');
  expect(csv).toContain('"2026-10-13","2","0","0"');
});

it("장기 기간은 화면과 CSV 모두 월별 합계·가중 완료율을 제공한다", async () => {
  mocks.query.mockResolvedValue([
    {
      data: {
        ...rawStats(),
        participation: [
          { day: "2024-12-01", starts: 10, completions: 2 },
          { day: "2025-01-01", starts: 5, completions: 1 },
        ],
      },
    },
  ]);
  const range = "from=2024-12-15&to=2025-04-10";
  const data = await (await stats(request("/api/admin/stats?" + range))).json();
  expect(data.reports[0].timeUnit).toBe("month");
  expect(data.reports[0].rows[0].rate).toBe(20);
  expect(data.reports[0].basis).toContain("첫·마지막 달은 선택 기간만 포함");
  const csv = await (
    await download(request("/api/admin/export?report=participation&" + range))
  ).text();
  expect(csv).toContain("집계월 (월 첫날 표기)");
  expect(csv).toContain('"2024-12-01","10","2","20"');
  const all = await (
    await download(
      request("/api/admin/export?report=participation&from=0001-01-01"),
    )
  ).text();
  expect(all).toContain("보관된 전체 기간");
  expect(all).not.toContain("0001-01-01");
});
