import { expect, it } from "vitest";
import {
  meaningfulRows,
  rankedRows,
  sumRows,
} from "../../src/lib/admin-presentation";
import type { AdminReport, AdminRow } from "../../src/lib/admin-contract";
const report = (id: string, rows: AdminRow[]): AdminReport => ({
  id,
  rows,
  title: "",
  basis: "",
  columns: [],
});
it("기록이 없는 날짜만 제외하고 가입 없이 수집한 날은 보존한다", () => {
  const rows = meaningfulRows(
    report("activity", [
      { day: "2026-10-01", accounts: 0, registrations: 0, cards: 0, goods: 0 },
      { day: "2026-10-02", accounts: 0, registrations: 0, cards: 3, goods: 0 },
      { day: "2026-10-03", accounts: 2, registrations: 1, cards: 1, goods: 0 },
    ]),
  );
  expect(rows.map((row) => row.day)).toEqual(["2026-10-02", "2026-10-03"]);
  expect(sumRows(rows, "accounts")).toBe(2);
  expect(sumRows(rows, "cards")).toBe(4);
});
it("수집 카드 0장은 실제 계정이 있으면 의미 있는 구간이다", () => {
  expect(
    meaningfulRows(
      report("distribution", [
        { cards: 0, accounts: 3 },
        { cards: 1, accounts: 0 },
        { cards: 16, accounts: 2 },
      ]),
    ),
  ).toEqual([
    { cards: 0, accounts: 3 },
    { cards: 16, accounts: 2 },
  ]);
});
it("완료나 교환이 없어도 시작·보유 기록은 상세 데이터에 남긴다", () => {
  expect(
    meaningfulRows(
      report("skills", [
        { name: "시작만", starts: 2, completions: 0, owners: 1 },
        { name: "미사용", starts: 0, completions: 0, owners: 0 },
      ]),
    ),
  ).toHaveLength(1);
  expect(
    meaningfulRows(
      report("goods", [
        { owners: 2, exchanges: 0 },
        { owners: 0, exchanges: 0 },
      ]),
    ),
  ).toEqual([{ owners: 2, exchanges: 0 }]);
  expect(
    meaningfulRows(
      report("characters", [{ firsts: 0, owners: 0, pending: 1 }]),
    ),
  ).toHaveLength(1);
});
it("선택 지표의 양수 항목을 순위로 보여주며 원본과 분모는 변경하지 않는다", () => {
  const rows = [
    { name: "A", firsts: 1, owners: 5 },
    { name: "B", firsts: 3, owners: 1 },
    { name: "C", firsts: 0, owners: 2 },
  ];
  expect(rankedRows(rows, "firsts").map((r) => r.name)).toEqual(["B", "A"]);
  expect(rankedRows(rows, "owners").map((r) => r.name)).toEqual([
    "A",
    "C",
    "B",
  ]);
  expect(sumRows(rows, "firsts")).toBe(4);
  expect(rows.map((r) => r.name)).toEqual(["A", "B", "C"]);
});
