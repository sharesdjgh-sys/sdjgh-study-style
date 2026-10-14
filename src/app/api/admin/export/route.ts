import {
  accountFilters,
  adminRange,
  AdminInputError,
} from "@/lib/admin-params";
import {
  adminAccounts,
  adminFailure,
  adminStats,
  characterName,
  requireAdmin,
} from "@/lib/admin-server";
import { csvDocument, csvResponse } from "@/lib/admin-csv";
import type { AdminReport } from "@/lib/admin-contract";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const id = params.get("report");
    if (id === "accounts") {
      const filters = accountFilters(params);
      const data = await adminAccounts(filters, true);
      const report: AdminReport = {
        id: "accounts",
        title: "계정별 현황",
        basis: "현재 계정·보유 상태",
        columns: [
          { key: "id", label: "서비스 계정 ID" },
          { key: "createdAt", label: "가입일" },
          { key: "registeredAt", label: "도감 등록일" },
          { key: "character", label: "첫 캐릭터" },
          { key: "opened", label: "개봉 카드" },
          { key: "pending", label: "미개봉 선물" },
          { key: "skills", label: "열린 스킬" },
          { key: "completed", label: "실천 완료" },
          { key: "goods", label: "굿즈" },
          { key: "hearts", label: "하트" },
          { key: "stars", label: "별" },
        ],
        rows: data.rows.map((row) => ({
          ...row,
          character: characterName(row.firstType),
        })),
      };
      return csvResponse(
        csvDocument(
          report,
          data.generatedAt,
          "현재",
          JSON.stringify({ ...filters, page: "전체" }),
        ),
        "studycrew-accounts.csv",
      );
    }
    const range = adminRange(params);
    const data = await adminStats(range);
    const report =
      id === "overview"
        ? ({
            id: "overview",
            title: "전체 현황",
            basis: "현재 계정·보유 상태",
            columns: [
              { key: "label", label: "지표" },
              { key: "value", label: "값" },
              { key: "unit", label: "단위" },
            ],
            rows: data.totals,
          } satisfies AdminReport)
        : data.reports.find((r) => r.id === id);
    if (!report) throw new AdminInputError("invalid_report");
    const period = ["overview", "characters", "distribution"].includes(
      report.id,
    )
      ? "현재"
      : range.from + " ~ " + range.to;
    return csvResponse(
      csvDocument(report, data.generatedAt, period),
      "studycrew-" + report.id + ".csv",
    );
  } catch (error) {
    return adminFailure(error);
  }
}
