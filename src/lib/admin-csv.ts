import type { AdminCell, AdminReport } from "./admin-contract";
export function csvCell(value: AdminCell) {
  let text = value === null ? "" : String(value);
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/.test(text))
    text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function csvDocument(
  report: AdminReport,
  generatedAt: string,
  period: string,
  filters = "",
) {
  const rows: AdminCell[][] = [
    ["보고서", report.title],
    ["기준", report.basis],
    ["기간", period],
    ["조회 시각", generatedAt],
    ...(filters ? [["필터", filters]] : []),
    [],
    report.columns.map((c) => c.label),
    ...report.rows.map((row) => report.columns.map((c) => row[c.key] ?? null)),
  ];
  return (
    "\uFEFF" +
    rows.map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
export function csvResponse(text: string, filename: string) {
  return new Response(text, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Cache-Control": "no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
