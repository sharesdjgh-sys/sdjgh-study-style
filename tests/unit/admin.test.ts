import { adminTimeUnit } from "../../src/lib/admin-contract";
import { afterEach, expect, it, vi } from "vitest";
import { isAdminAccount } from "../../src/lib/admin-access";
import { accountFilters, adminRange } from "../../src/lib/admin-params";
import { csvCell, csvDocument } from "../../src/lib/admin-csv";
import { authReturnPath } from "../../src/lib/auth-contract";
const id = "123e4567-e89b-42d3-a456-426614174000";
afterEach(() => vi.unstubAllEnvs());
it("관리자 UUID 허용 목록은 빈 값과 잘못된 항목을 거부한다", () => {
  vi.stubEnv("ADMIN_ACCOUNT_IDS", "");
  expect(isAdminAccount(id)).toBe(false);
  vi.stubEnv("ADMIN_ACCOUNT_IDS", "invalid, " + id.toUpperCase() + ",");
  expect(isAdminAccount(id)).toBe(true);
  expect(isAdminAccount("invalid")).toBe(false);
  expect(isAdminAccount(undefined)).toBe(false);
  expect(isAdminAccount(id.replace(/0$/, "1"))).toBe(false);
});
it("한국 날짜와 장기 조회, 윤일, 역전 기간을 검증한다", () => {
  const now = new Date("2026-10-13T15:00:00Z");
  expect(adminRange(new URLSearchParams(), now)).toEqual({
    from: "2026-09-15",
    to: "2026-10-14",
  });
  expect(
    adminRange(new URLSearchParams("from=2026-07-17&to=2026-10-14"), now).from,
  ).toBe("2026-07-17");
  expect(adminRange(new URLSearchParams("from=2020-01-01"), now).from).toBe(
    "2020-01-01",
  );
  expect(adminRange(new URLSearchParams("from=0001-01-01"), now).from).toBe(
    "0001-01-01",
  );
  expect(
    adminRange(new URLSearchParams("from=2024-02-29&to=2024-03-01"), now).from,
  ).toBe("2024-02-29");
  for (const text of [
    "from=0000-01-01",
    "to=2026-10-15",
    "from=2026-10-14&to=2026-10-13",
    "from=2026-02-30",
    "from=bad",
  ])
    expect(() => adminRange(new URLSearchParams(text), now)).toThrow();
});
it("계정 필터와 페이지를 검증하고 SQL 문법 입력을 허용하지 않는다", () => {
  expect(
    accountFilters(
      new URLSearchParams("q=ABC-123&status=complete&sort=cards&page=2"),
    ),
  ).toEqual({
    q: "abc-123",
    status: "complete",
    sort: "cards",
    type: "",
    page: 2,
  });
  for (const text of [
    "page=0",
    "page=1e2",
    "q=%25",
    "sort=DROP",
    "type=unknown",
    "status=active",
  ])
    expect(() => accountFilters(new URLSearchParams(text))).toThrow();
});
it("관리자 로그인은 정확한 내부 경로로만 복귀한다", () => {
  expect(authReturnPath("/admin")).toBe("/admin");
  for (const path of [
    "/admin/other",
    "/admin?returnTo=https://evil.test",
    "//evil.test/admin",
    "https://evil.test/admin",
  ])
    expect(authReturnPath(path)).toBe("/collection");
});
it("CSV는 BOM·따옴표·줄바꿈·수식 방어 및 숫자 타입을 보존한다", () => {
  expect(csvCell('한글,"다음"\n줄')).toBe('"한글,""다음""\n줄"');
  expect(csvCell(" \t=SUM(1,2)")).toBe('"\' \t=SUM(1,2)"');
  expect(csvCell("\r@malicious")).toBe('"\'\r@malicious"');
  expect(csvCell(-3)).toBe('"-3"');
  const csv = csvDocument(
    {
      id: "test",
      title: "검사",
      basis: "시작일 기준",
      columns: [{ key: "n", label: "건수" }],
      rows: [{ n: 12 }],
    },
    "2026-10-14T00:00:00Z",
    "2026-10-01 ~ 2026-10-14",
  );
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"건수"\r\n"12"');
  expect(csv).toContain('"기준","시작일 기준"');
});

it("90일 이하는 일별, 91일 이상과 전체는 월별로 묶는다", () => {
  expect(adminTimeUnit({ from: "2026-07-17", to: "2026-10-14" })).toBe("day");
  expect(adminTimeUnit({ from: "2026-07-16", to: "2026-10-14" })).toBe("month");
  expect(adminTimeUnit({ from: "0001-01-01", to: "2026-10-14" })).toBe("month");
});
