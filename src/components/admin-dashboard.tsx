"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-provider";
import { CHARACTERS } from "@/lib/characters";
import { STUDY_TYPES } from "@/lib/content";
import { getMethod, type MethodId } from "@/lib/methods";
import { getGoods } from "@/lib/goods";
import {
  daysBefore,
  defaultAdminRange,
  koreaDay,
  type AdminAccounts,
  type AdminDetail,
  type AdminReport,
  type AdminStats,
} from "@/lib/admin-contract";
import styles from "./admin-dashboard.module.css";

const tabs = [
  ["overview", "전체 현황"],
  ["participation", "검사 참여"],
  ["collection", "캐릭터·카드"],
  ["skills", "스킬·굿즈"],
  ["accounts", "계정별 현황"],
] as const;
const number = (n: number) => n.toLocaleString("ko-KR");
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "미등록";
const name = (code: string | null) =>
  code ? (CHARACTERS[code]?.name ?? code) : "미등록";
type Resource<T> = { url: string; data?: T; error?: string; denied?: boolean };
function useResource<T>(url: string, revision: number) {
  const [state, setState] = useState<Resource<T>>({ url: "" });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setState({ url });
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(20000),
          ]),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (active)
            setState({
              url,
              denied: [401, 403].includes(response.status),
              error:
                body.error === "not_found"
                  ? "계정이 삭제되었거나 존재하지 않아요. 목록을 새로고침해 주세요."
                  : body.error === "invalid_query"
                    ? "검색 조건을 확인해 주세요. 기간은 최근 90일 안에서 선택할 수 있어요."
                    : "불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
            });
          return;
        }
        const data: T = await response.json();
        if (active) setState({ url, data });
      } catch {
        if (active)
          setState({ url, error: "연결을 확인하고 다시 시도해 주세요." });
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [url, revision]);
  return state.url === url ? state : { url };
}
function Notice({ children }: { children: ReactNode }) {
  return (
    <p className={styles.notice} role="status">
      {children}
    </p>
  );
}
function ResourceState({
  error,
  onRetry,
}: {
  error?: string;
  onRetry: () => void;
}) {
  return error ? (
    <div>
      <Notice>{error}</Notice>
      <button className="button secondary" onClick={onRetry}>
        다시 불러오기
      </button>
    </div>
  ) : (
    <Notice>현황을 불러오는 중이에요…</Notice>
  );
}
function ExportButton({
  query,
  onDenied,
}: {
  query: URLSearchParams;
  onDenied: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  async function download() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/export?" + query.toString(), {
        cache: "no-store",
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(30000),
        ]),
      });
      if (!alive.current) return;
      if ([401, 403].includes(response.status)) {
        onDenied();
        return;
      }
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw Error(
          result.error === "export_too_large"
            ? "10,000행을 초과했어요. 검색 조건을 좁혀 주세요."
            : "다운로드하지 못했어요. 다시 시도해 주세요.",
        );
      }
      const blob = await response.blob();
      if (!alive.current) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "studycrew-" + (query.get("report") ?? "report") + ".csv";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error &&
            e.name !== "TimeoutError" &&
            e.name !== "AbortError"
            ? e.message
            : "연결을 확인하고 다시 다운로드해 주세요.",
        );
    } finally {
      request.current = null;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void download()}
      >
        {busy ? "내보내는 중…" : "CSV 다운로드"}
      </button>
      {error && <Notice>{error}</Notice>}
    </div>
  );
}
function Report({
  report,
  range,
  onDenied,
}: {
  report: AdminReport;
  range: { from: string; to: string };
  onDenied: () => void;
}) {
  const chart = report.chart;
  const max = chart
    ? Math.max(1, ...report.rows.map((r) => Number(r[chart.value])))
    : 1;
  return (
    <section className={styles.panel} aria-labelledby={"report-" + report.id}>
      <div className={styles.panelHead}>
        <div>
          <h2 id={"report-" + report.id}>{report.title}</h2>
          <p>{report.basis}</p>
        </div>
        <ExportButton
          query={new URLSearchParams({ ...range, report: report.id })}
          onDenied={onDenied}
        />
      </div>
      {chart && report.rows.length > 0 && (
        <div className={styles.bars} aria-label={report.title + " 그래프"}>
          {report.rows.map((row, i) => (
            <div className={styles.barRow} key={i}>
              <span>{String(row[chart.label])}</span>
              <div className={styles.track}>
                <div
                  style={{
                    width: (Number(row[chart.value]) / max) * 100 + "%",
                  }}
                />
              </div>
              <b>{number(Number(row[chart.value]))}</b>
            </div>
          ))}
        </div>
      )}
      <div
        className={styles.tableScroll}
        tabIndex={0}
        role="region"
        aria-label={report.title + " 표"}
      >
        <table>
          <caption className={styles.srOnly}>{report.title}</caption>
          <thead>
            <tr>
              {report.columns.map((c) => (
                <th scope="col" key={c.key}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row, i) => (
              <tr key={i}>
                {report.columns.map((c) => (
                  <td key={c.key}>
                    {typeof row[c.key] === "number"
                      ? number(row[c.key] as number)
                      : (row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!report.rows.length && (
          <Notice>이 조건에 해당하는 기록이 없어요.</Notice>
        )}
      </div>
    </section>
  );
}
export function AdminDashboard({
  initialAccess,
}: {
  initialAccess: "allowed" | "anonymous" | "forbidden" | "unavailable";
}) {
  const auth = useAuth();
  const allowed =
    auth.status === "authenticated" && auth.session.isAdmin === true;
  return (
    <main id="main" className={styles.page}>
      <header className={styles.heading}>
        <span className="eyebrow">STUDYCREW ADMIN</span>
        <h1>관리자 통계</h1>
        <p>참여부터 수집과 실천까지, 서비스의 현재 모습을 살펴봐요.</p>
      </header>
      {auth.busy ? (
        <Notice>
          {initialAccess === "unavailable"
            ? "접근 상태를 다시 확인하고 있어요…"
            : "관리자 권한을 확인하고 있어요…"}
        </Notice>
      ) : allowed ? (
        <Workspace
          key={auth.session.accountId}
          onRecheck={() => void auth.refresh()}
        />
      ) : (
        <section className={styles.panel}>
          <h2>
            {auth.status === "anonymous"
              ? "관리자 계정으로 로그인해 주세요"
              : "접근 권한을 확인해 주세요"}
          </h2>
          <p>
            {auth.status === "authenticated"
              ? "지정된 관리자 계정만 통계를 볼 수 있어요."
              : auth.message || "카카오 로그인 후 관리자 권한을 확인합니다."}
          </p>
          {auth.status === "anonymous" ? (
            <button
              className="button primary"
              disabled={!auth.session.configured}
              onClick={() => void auth.login()}
            >
              카카오 로그인
            </button>
          ) : (
            <button
              className="button secondary"
              onClick={() => void auth.refresh()}
            >
              권한 다시 확인
            </button>
          )}
        </section>
      )}
    </main>
  );
}
function Workspace({ onRecheck }: { onRecheck: () => void }) {
  const [tab, setTab] = useState<string>("overview");
  const [range, setRange] = useState(() => defaultAdminRange());
  const [draft, setDraft] = useState(range);
  const [revision, setRevision] = useState(0);
  const [denied, setDenied] = useState(false);
  const reject = useCallback(() => {
    setDenied(true);
    onRecheck();
  }, [onRecheck]);
  const stats = useResource<AdminStats>(
    "/api/admin/stats?" + new URLSearchParams(range),
    revision,
  );
  if (denied || stats.denied)
    return (
      <section className={styles.panel}>
        <Notice>
          관리자 권한이 없거나 로그인이 만료되었어요. 다시 확인해 주세요.
        </Notice>
        <button
          className="button secondary"
          onClick={() => {
            setDenied(false);
            setRevision((n) => n + 1);
            onRecheck();
          }}
        >
          권한 다시 확인
        </button>
      </section>
    );
  const selectedReports =
    stats.data?.reports.filter((r) =>
      tab === "overview"
        ? r.id === "activity"
        : tab === "participation"
          ? ["participation", "sources"].includes(r.id)
          : tab === "collection"
            ? ["characters", "distribution"].includes(r.id)
            : tab === "skills"
              ? ["skills", "goods-kinds", "goods"].includes(r.id)
              : false,
    ) ?? [];
  const today = koreaDay();
  return (
    <>
      <nav className={styles.tabs} aria-label="관리자 통계 메뉴">
        {tabs.map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab !== "accounts" && (
        <>
          <section className={styles.filters} aria-label="통계 기간">
            <div className={styles.presets}>
              {[1, 7, 30, 90].map((days) => (
                <button
                  key={days}
                  className="button secondary"
                  aria-pressed={
                    range.from === daysBefore(today, days - 1) &&
                    range.to === today
                  }
                  onClick={() => {
                    const next = defaultAdminRange(days);
                    setRange(next);
                    setDraft(next);
                  }}
                >
                  {days === 1 ? "오늘" : days + "일"}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRange(draft);
              }}
            >
              <label>
                시작일
                <input
                  type="date"
                  required
                  min={daysBefore(today, 89)}
                  max={draft.to}
                  value={draft.from}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                />
              </label>
              <label>
                종료일
                <input
                  type="date"
                  required
                  min={draft.from}
                  max={today}
                  value={draft.to}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                />
              </label>
              <button className="button primary">기간 적용</button>
            </form>
            <button
              className="button secondary"
              onClick={() => setRevision((n) => n + 1)}
            >
              새로고침
            </button>
          </section>
          <p className={styles.context}>
            한국 시간 기준 · 기간 필터는 활동 추이에 적용됩니다. 보유량과 첫
            캐릭터 분포는 현재 상태입니다.
          </p>
          <p className={styles.context}>
            검사 통계는 최근 90일의 수집된 기록입니다. 검사 건수는 고유 학생
            수와 다르며, 비로그인 결과의 캐릭터 종류는 포함하지 않습니다. 계정
            통계는 탈퇴자를 제외합니다.
          </p>
          {!stats.data ? (
            <ResourceState
              error={stats.error}
              onRetry={() => setRevision((n) => n + 1)}
            />
          ) : (
            <>
              <p className={styles.updated}>
                조회 시각 {date(stats.data.generatedAt)}
              </p>
              {tab === "overview" && (
                <section className={styles.panel} aria-label="현재 전체 현황">
                  <div className={styles.panelHead}>
                    <div>
                      <h2>현재 전체 현황</h2>
                      <p>
                        관리자 계정을 포함한 전체 계정 · 평균 수집량과 완성률은
                        도감 등록 계정 기준
                      </p>
                    </div>
                    <ExportButton
                      query={
                        new URLSearchParams({ ...range, report: "overview" })
                      }
                      onDenied={reject}
                    />
                  </div>
                  <dl className={styles.metrics}>
                    {stats.data.totals.map((m) => (
                      <div key={m.label}>
                        <dt>{m.label}</dt>
                        <dd>
                          {number(m.value)}
                          <small>{m.unit}</small>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
              {selectedReports.map((report) => (
                <Report
                  key={report.id}
                  report={report}
                  range={stats.data!.range}
                  onDenied={reject}
                />
              ))}
            </>
          )}
        </>
      )}
      {tab === "accounts" && <Accounts onDenied={reject} />}
    </>
  );
}
function Accounts({ onDenied }: { onDenied: () => void }) {
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    status: "all",
    sort: "newest",
    page: "1",
  });
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const resource = useResource<AdminAccounts>(
    "/api/admin/accounts?" + new URLSearchParams(filters),
    revision,
  );
  const detail = useResource<AdminDetail>(
    selected ? "/api/admin/accounts/" + selected : "",
    revision,
  );
  useEffect(() => {
    if (resource.denied || detail.denied) onDenied();
  }, [resource.denied, detail.denied, onDenied]);
  function update(key: string, value: string) {
    setSelected(null);
    setFilters((old) => ({ ...old, [key]: value, page: "1" }));
  }
  return (
    <>
      <section className={styles.filters} aria-label="계정 검색">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update("q", search);
          }}
        >
          <label>
            계정 ID 검색
            <input
              value={search}
              maxLength={36}
              placeholder="서비스 계정 ID 일부"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="button primary">검색</button>
        </form>
        <label>
          첫 캐릭터
          <select
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="">전체</option>
            {STUDY_TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {name(t.code)}
              </option>
            ))}
          </select>
        </label>
        <label>
          도감 상태
          <select
            value={filters.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="all">전체</option>
            <option value="unregistered">미등록</option>
            <option value="collecting">수집 중</option>
            <option value="complete">16종 완성</option>
          </select>
        </label>
        <label>
          정렬
          <select
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="newest">최근 가입순</option>
            <option value="cards">수집량 많은 순</option>
          </select>
        </label>
        <button
          className="button secondary"
          onClick={() => {
            setSelected(null);
            setRevision((n) => n + 1);
          }}
        >
          목록 새로고침
        </button>
        <ExportButton
          query={new URLSearchParams({ ...filters, report: "accounts" })}
          onDenied={onDenied}
        />
      </section>
      <p className={styles.context}>
        실명·학교·학년을 저장하지 않습니다. 계정 ID는 서비스 내부 식별자이며, 각
        수치는 현재 상태입니다.
      </p>
      {!resource.data ? (
        <ResourceState
          error={resource.error}
          onRetry={() => setRevision((n) => n + 1)}
        />
      ) : (
        <section className={styles.panel} aria-label="계정 목록">
          <div className={styles.panelHead}>
            <h2>계정 {number(resource.data.total)}개</h2>
            <p>조회 시각 {date(resource.data.generatedAt)}</p>
          </div>
          <div
            className={styles.tableScroll}
            tabIndex={0}
            role="region"
            aria-label="계정별 현황 표"
          >
            <table>
              <thead>
                <tr>
                  {[
                    "계정 ID",
                    "가입일",
                    "도감 등록일",
                    "첫 캐릭터",
                    "개봉",
                    "미개봉",
                    "스킬",
                    "실천 완료",
                    "굿즈",
                    "하트",
                    "별",
                  ].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resource.data.rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <button
                        className={styles.accountLink}
                        aria-label={a.id + " 상세 보기"}
                        onClick={() => setSelected(a.id)}
                      >
                        {a.id}
                      </button>
                    </td>
                    <td>{date(a.createdAt)}</td>
                    <td>{date(a.registeredAt)}</td>
                    <td>{name(a.firstType)}</td>
                    {[
                      a.opened,
                      a.pending,
                      a.skills,
                      a.completed,
                      a.goods,
                      a.hearts,
                      a.stars,
                    ].map((v, i) => (
                      <td key={i}>{number(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!resource.data.rows.length && (
              <Notice>이 조건에 해당하는 계정이 없어요.</Notice>
            )}
          </div>
          <div className={styles.pagination}>
            <button
              className="button secondary"
              disabled={Number(filters.page) <= 1}
              onClick={() => {
                setSelected(null);
                setFilters({
                  ...filters,
                  page: String(Number(filters.page) - 1),
                });
              }}
            >
              이전
            </button>
            <span>
              {filters.page} /{" "}
              {Math.max(1, Math.ceil(resource.data.total / 50))} 페이지
            </span>
            <button
              className="button secondary"
              disabled={Number(filters.page) * 50 >= resource.data.total}
              onClick={() => {
                setSelected(null);
                setFilters({
                  ...filters,
                  page: String(Number(filters.page) + 1),
                });
              }}
            >
              다음
            </button>
          </div>
        </section>
      )}
      {selected && (
        <section className={styles.panel} aria-label="선택 계정 상세">
          <div className={styles.panelHead}>
            <h2>계정 상세</h2>
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              상세 닫기
            </button>
          </div>
          {!detail.data ? (
            <ResourceState
              error={detail.error}
              onRetry={() => setRevision((n) => n + 1)}
            />
          ) : (
            <>
              <p className={styles.accountId}>{detail.data.account.id}</p>
              <p>
                첫 캐릭터: {name(detail.data.account.firstType)} · 조회 시각{" "}
                {date(detail.data.generatedAt)}
              </p>
              <h3>16종 카드 수집 상태</h3>
              <ul className={styles.cardGrid}>
                {STUDY_TYPES.map((t) => {
                  const card = detail.data!.cards.find(
                    (c) => c.code === t.code,
                  );
                  return (
                    <li key={t.code} data-owned={Boolean(card?.openedAt)}>
                      <strong>{name(t.code)}</strong>
                      <span>
                        {card
                          ? card.openedAt
                            ? "수집 완료"
                            : "미개봉 선물"
                          : "미보유"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <h3>열린 스킬 {detail.data.skills.length}개</h3>
              <p>
                {detail.data.skills
                  .map((id) => getMethod(id as MethodId)?.name ?? id)
                  .join(" · ") || "열린 스킬이 없어요."}
              </p>
              <h3>보유 굿즈 {detail.data.goods.length}개</h3>
              <ul className={styles.goodsList}>
                {detail.data.goods.map((id) => (
                  <li key={id}>
                    {getGoods(id)?.name} · {getGoods(id)?.title ?? id}
                  </li>
                ))}
              </ul>
              {!detail.data.goods.length && <p>보유한 굿즈가 없어요.</p>}
            </>
          )}
        </section>
      )}
    </>
  );
}
