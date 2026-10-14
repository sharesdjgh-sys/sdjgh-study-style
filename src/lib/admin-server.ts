import { account, json } from "./collection-server";
import { database } from "./db";
import { isAdminAccount } from "./admin-access";
import { AdminInputError, type AccountFilters } from "./admin-params";
import {
  ADMIN_ACCOUNTS_SQL,
  ADMIN_DETAIL_SQL,
  ADMIN_STATS_SQL,
} from "./admin-queries";
import type {
  AdminAccounts,
  AdminDetail,
  AdminRange,
  AdminReport,
  AdminRow,
  AdminStats,
} from "./admin-contract";
import { CHARACTERS } from "./characters";
import { getMethod, type MethodId } from "./methods";
import { getGoods } from "./goods";

export class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireAdmin() {
  const owner = await account();
  if (!owner) throw new AdminError(401, "unauthorized");
  if (!isAdminAccount(owner.id)) throw new AdminError(403, "forbidden");
  return owner;
}
export function adminFailure(error: unknown) {
  if (error instanceof AdminError)
    return json({ error: error.message }, error.status);
  if (error instanceof AdminInputError)
    return json({ error: "invalid_query" }, 400);
  return json({ error: "unavailable" }, 503);
}
export const characterName = (code: string | null) =>
  code ? (CHARACTERS[code]?.name ?? code) : "미등록";
export const kindName = (kind: string) =>
  ({ daily: "일상", special: "특별 의상", motion: "모션" })[kind] ?? kind;
export function completionRate(starts: number, completions: number) {
  return starts ? Math.round((completions / starts) * 1000) / 10 : 0;
}
type RawStats = {
  generatedAt: string;
  summary: Record<string, number>;
  participation: AdminRow[];
  sources: AdminRow[];
  activity: AdminRow[];
  characters: AdminRow[];
  distribution: AdminRow[];
  skills: AdminRow[];
  goods: AdminRow[];
};
function report(
  id: string,
  title: string,
  basis: string,
  columns: [string, string][],
  rows: AdminRow[],
  chart?: AdminReport["chart"],
): AdminReport {
  return {
    id,
    title,
    basis,
    columns: columns.map(([key, label]) => ({ key, label })),
    rows,
    ...(chart ? { chart } : {}),
  };
}
export async function adminStats(range: AdminRange): Promise<AdminStats> {
  const rows = await database().query(ADMIN_STATS_SQL, [range.from, range.to]);
  return describeStats(rows[0].data as RawStats, range);
}
export function describeStats(data: RawStats, range: AdminRange): AdminStats {
  const s = data.summary;
  const registered = s.registered;
  const sourceNames: Record<string, string> = {
    direct: "직접 접속",
    qr: "QR",
    school: "학교 링크",
    share: "공유",
  };
  const withRates = (rows: AdminRow[]) =>
    rows.map((row) => ({
      ...row,
      rate: completionRate(Number(row.starts), Number(row.completions)),
    }));
  const kinds = ["daily", "special", "motion"].map((kind) => ({
    kind: kindName(kind),
    owners: data.goods
      .filter((g) => g.kind === kind)
      .reduce((n, g) => n + Number(g.owners), 0),
    exchanges: data.goods
      .filter((g) => g.kind === kind)
      .reduce((n, g) => n + Number(g.exchanges), 0),
  }));
  return {
    generatedAt: data.generatedAt,
    range,
    totals: [
      { label: "전체 계정", value: s.accounts, unit: "계정" },
      { label: "도감 등록", value: registered, unit: "계정" },
      { label: "개봉 카드", value: s.cards, unit: "장" },
      { label: "미개봉 선물", value: s.pending, unit: "장" },
      { label: "16종 완성", value: s.complete, unit: "계정" },
      {
        label: "도감 완성률",
        value: completionRate(registered, s.complete),
        unit: "%",
      },
      { label: "평균 수집량", value: s.average, unit: "장" },
      { label: "실천 완료", value: s.practices, unit: "건" },
      { label: "굿즈 보유", value: s.goods, unit: "개" },
    ],
    reports: [
      report(
        "participation",
        "검사 참여 추이",
        "기간 내 검사 시작일 기준 · 완료율은 해당 검사 중 완료 비율 · 최근 검사는 진행에 따라 변동",
        [
          ["day", "시작일"],
          ["starts", "시작 건수"],
          ["completions", "완료 건수"],
          ["rate", "완료율 (%)"],
        ],
        withRates(data.participation),
        { label: "day", value: "starts" },
      ),
      report(
        "sources",
        "유입 경로",
        "기간 내 시작한 검사 · 고유 학생 수가 아닌 검사 건수",
        [
          ["source", "유입"],
          ["starts", "시작 건수"],
          ["completions", "완료 건수"],
          ["rate", "완료율 (%)"],
        ],
        withRates(
          data.sources.map((row) => ({
            ...row,
            source: sourceNames[String(row.source)] ?? row.source,
          })),
        ),
        { label: "source", value: "starts" },
      ),
      report(
        "activity",
        "가입·등록·수집 추이",
        "기간 내 각 활동 발생일 기준 · 현재 남아 있는 계정 데이터",
        [
          ["day", "날짜"],
          ["accounts", "신규 계정"],
          ["registrations", "도감 등록"],
          ["cards", "카드 개봉"],
          ["goods", "굿즈 교환"],
        ],
        data.activity,
      ),
      report(
        "characters",
        "첫 캐릭터와 카드 보유",
        "현재 상태 · 첫 캐릭터는 도감 최초 등록 결과 · 재검사와 초대 보상은 첫 캐릭터 분포에서 제외",
        [
          ["name", "캐릭터"],
          ["firsts", "첫 캐릭터 계정 수"],
          ["share", "첫 캐릭터 비율 (%)"],
          ["owners", "개봉 보유 계정 수"],
          ["pending", "미개봉 카드 수"],
        ],
        data.characters.map((row) => ({
          ...row,
          name: characterName(String(row.code)),
          share: completionRate(registered, Number(row.firsts)),
        })),
        { label: "name", value: "firsts" },
      ),
      report(
        "distribution",
        "카드 수집량 분포",
        "현재 상태 · 도감 등록 계정의 개봉 카드 기준",
        [
          ["cards", "수집한 카드 (장)"],
          ["accounts", "계정 수"],
        ],
        data.distribution,
        { label: "cards", value: "accounts" },
      ),
      report(
        "skills",
        "스킬 해금과 실천",
        "해금 계정 수는 현재 보유 기준 · 실천은 기간 내 시작 건의 현재 완료 상태 · 반복 실천 포함",
        [
          ["name", "스킬"],
          ["owners", "해금 계정 수"],
          ["starts", "실천 시작"],
          ["completions", "실천 완료"],
          ["completers", "완료 계정 수"],
          ["rate", "완료율 (%)"],
        ],
        withRates(
          data.skills.map((row) => ({
            ...row,
            name: getMethod(String(row.method) as MethodId)?.name ?? row.method,
          })),
        ),
        { label: "name", value: "completions" },
      ),
      report(
        "goods-kinds",
        "굿즈 종류별 현황",
        "보유 수는 현재 상태 · 교환 수는 선택 기간에 발생한 교환",
        [
          ["kind", "종류"],
          ["owners", "보유 수"],
          ["exchanges", "기간 내 교환 수"],
        ],
        kinds,
        { label: "kind", value: "exchanges" },
      ),
      report(
        "goods",
        "굿즈 교환 현황",
        "보유 수는 현재 상태 · 교환 수는 선택 기간 · 동일 계정의 동일 굿즈는 한 번 집계",
        [
          ["character", "캐릭터"],
          ["name", "굿즈"],
          ["kind", "종류"],
          ["owners", "보유 수"],
          ["exchanges", "기간 내 교환 수"],
        ],
        data.goods.map((row) => ({
          ...row,
          character: characterName(String(row.code)),
          name: getGoods(String(row.id))?.title ?? row.id,
          kind: kindName(String(row.kind)),
        })),
      ),
    ],
  };
}
export async function adminAccounts(
  filters: AccountFilters,
  exporting = false,
): Promise<AdminAccounts> {
  const pageSize = exporting ? 10001 : 50;
  const rows = await database().query(ADMIN_ACCOUNTS_SQL, [
    filters.q,
    filters.type,
    filters.status,
    filters.sort,
    pageSize,
    exporting ? 0 : (filters.page - 1) * 50,
  ]);
  const data = rows[0].data as Omit<AdminAccounts, "page" | "pageSize">;
  if (exporting && data.total > 10000)
    throw new AdminError(422, "export_too_large");
  return { ...data, page: exporting ? 1 : filters.page, pageSize };
}
export async function adminDetail(id: string): Promise<AdminDetail> {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
    throw new AdminInputError("invalid_account");
  const rows = await database().query(ADMIN_DETAIL_SQL, [id]);
  if (!rows.length) throw new AdminError(404, "not_found");
  return rows[0].data as AdminDetail;
}
