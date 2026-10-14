import { STUDY_TYPES } from "./content";
import {
  ADMIN_ALL_FROM,
  defaultAdminRange,
  koreaDay,
  type AdminRange,
} from "./admin-contract";

export class AdminInputError extends Error {}
const invalid = () => {
  throw new AdminInputError("invalid_query");
};
export function adminRange(
  params: URLSearchParams,
  now = new Date(),
): AdminRange {
  const defaults = defaultAdminRange(30, now);
  const from = params.get("from") ?? defaults.from;
  const to = params.get("to") ?? defaults.to;
  const today = koreaDay(now);
  for (const date of [from, to]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) invalid();
    const parsed = new Date(date + "T00:00:00Z");
    if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    )
      invalid();
  }
  if (from > to || to > today || from < ADMIN_ALL_FROM) invalid();
  return { from, to };
}
export type AccountFilters = {
  q: string;
  type: string;
  status: string;
  sort: string;
  page: number;
};
export function accountFilters(params: URLSearchParams): AccountFilters {
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const type = params.get("type") ?? "";
  const status = params.get("status") ?? "all";
  const sort = params.get("sort") ?? "newest";
  const pageText = params.get("page") ?? "1";
  if (q.length > 36 || !/^[a-f0-9-]*$/.test(q)) invalid();
  if (type && !STUDY_TYPES.some((t) => t.code === type)) invalid();
  if (!["all", "unregistered", "collecting", "complete"].includes(status))
    invalid();
  if (!["newest", "cards"].includes(sort)) invalid();
  if (!/^[1-9]\d{0,5}$/.test(pageText)) invalid();
  return { q, type, status, sort, page: Number(pageText) };
}
