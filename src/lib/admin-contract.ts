export type AdminCell = string | number | null;
export type AdminRow = Record<string, AdminCell>;
export type AdminReport = {
  id: string;
  title: string;
  basis: string;
  columns: { key: string; label: string }[];
  rows: AdminRow[];
  chart?: { label: string; value: string };
};
export type AdminRange = { from: string; to: string };
export type AdminStats = {
  generatedAt: string;
  range: AdminRange;
  totals: { label: string; value: number; unit: string }[];
  reports: AdminReport[];
};
export type AdminAccount = {
  id: string;
  createdAt: string;
  registeredAt: string | null;
  firstType: string | null;
  opened: number;
  pending: number;
  skills: number;
  completed: number;
  goods: number;
  hearts: number;
  stars: number;
};
export type AdminAccounts = {
  generatedAt: string;
  total: number;
  page: number;
  pageSize: number;
  rows: AdminAccount[];
};
export type AdminDetail = {
  generatedAt: string;
  account: AdminAccount;
  cards: { code: string; openedAt: string | null }[];
  skills: string[];
  goods: string[];
};
export function koreaDay(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
export function daysBefore(day: string, days: number) {
  return new Date(Date.parse(day + "T00:00:00Z") - days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function defaultAdminRange(days = 30, now = new Date()): AdminRange {
  const to = koreaDay(now);
  return { from: daysBefore(to, days - 1), to };
}
