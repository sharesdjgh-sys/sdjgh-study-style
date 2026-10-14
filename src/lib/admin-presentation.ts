import type { AdminReport, AdminRow } from "./admin-contract";

const activityKeys: Record<string, string[]> = {
  participation: ["starts", "completions"],
  sources: ["starts", "completions"],
  activity: ["accounts", "registrations", "cards", "goods"],
  characters: ["firsts", "owners", "pending"],
  distribution: ["accounts"],
  skills: ["owners", "starts", "completions"],
  "goods-kinds": ["owners", "exchanges"],
  goods: ["owners", "exchanges"],
};
export const count = (row: AdminRow, key: string) => Number(row[key] ?? 0);
export function meaningfulRows(report: AdminReport) {
  const keys = activityKeys[report.id];
  return keys
    ? report.rows.filter((row) => keys.some((key) => count(row, key) > 0))
    : report.rows;
}
export function rankedRows(rows: AdminRow[], key: string) {
  return rows
    .filter((row) => count(row, key) > 0)
    .sort((a, b) => count(b, key) - count(a, key));
}
export function sumRows(rows: AdminRow[], key: string) {
  return rows.reduce((sum, row) => sum + count(row, key), 0);
}
