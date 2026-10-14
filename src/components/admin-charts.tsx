"use client";
import Image from "next/image";
import { useState } from "react";
import { CHARACTERS, characterThumbnail } from "@/lib/characters";
import type { AdminReport, AdminStats } from "@/lib/admin-contract";
import {
  count,
  meaningfulRows,
  rankedRows,
  sumRows,
} from "@/lib/admin-presentation";
import styles from "./admin-dashboard.module.css";

const number = (value: number) => value.toLocaleString("ko-KR");
export function CharacterFace({
  code,
  size = 56,
}: {
  code: string | null;
  size?: number;
}) {
  if (!code || !CHARACTERS[code]) return null;
  return (
    <Image
      loading="eager"
      className={styles.face}
      src={characterThumbnail(code)}
      alt={CHARACTERS[code].name}
      width={size}
      height={size}
    />
  );
}
const metrics: Record<string, [string, string, string][]> = {
  activity: [
    ["accounts", "신규 가입", "계정"],
    ["registrations", "도감 등록", "계정"],
    ["cards", "카드 개봉", "장"],
    ["goods", "굿즈 교환", "개"],
  ],
  participation: [
    ["starts", "검사 시작", "건"],
    ["completions", "검사 완료", "건"],
  ],
  characters: [
    ["firsts", "첫 캐릭터", "계정"],
    ["owners", "카드 보유", "계정"],
    ["pending", "미개봉 선물", "장"],
  ],
  skills: [
    ["completions", "실천 완료", "건"],
    ["starts", "실천 시작", "건"],
    ["owners", "스킬 해금", "계정"],
  ],
  goods: [
    ["exchanges", "기간 내 교환", "개"],
    ["owners", "현재 보유", "개"],
  ],
  "goods-kinds": [
    ["exchanges", "기간 내 교환", "개"],
    ["owners", "현재 보유", "개"],
  ],
  sources: [
    ["starts", "검사 시작", "건"],
    ["completions", "검사 완료", "건"],
  ],
  distribution: [["accounts", "수집 계정", "계정"]],
};
export function ReportChart({
  report,
  compact = false,
}: {
  report: AdminReport;
  compact?: boolean;
}) {
  const choices = metrics[report.id] ?? [];
  const [selected, setSelected] = useState(choices[0]?.[0] ?? "");
  const [expanded, setExpanded] = useState(false);
  const [key, label, unit] = choices.find((choice) => choice[0] === selected) ??
    choices[0] ?? ["", "", ""];
  const rows = meaningfulRows(report);
  const chronological = ["activity", "participation"].includes(report.id);
  const monthly = report.timeUnit === "month";
  const histogram = report.id === "distribution";
  const characters = report.id === "characters";
  const active =
    chronological || histogram
      ? rows.filter((row) => count(row, key) > 0)
      : rankedRows(rows, key);
  const visible =
    chronological || histogram || expanded
      ? active
      : active.slice(0, compact ? 5 : 8);
  const total = sumRows(rows, key);
  const max = Math.max(1, ...active.map((row) => count(row, key)));
  const starts = sumRows(rows, "starts");
  const completed = sumRows(rows, "completions");
  return (
    <div className={styles.visual}>
      {!compact && choices.length > 1 && (
        <div className={styles.chartTabs} aria-label={report.title + " 지표"}>
          {choices.map(([value, title]) => (
            <button
              key={value}
              aria-pressed={key === value}
              onClick={() => {
                setSelected(value);
                setExpanded(false);
              }}
            >
              {title}
            </button>
          ))}
        </div>
      )}
      {!active.length ? (
        <div className={styles.emptyChart}>
          <span aria-hidden="true">—</span>
          <p>{label} 기록이 아직 없어요.</p>
          <small>
            {chronological
              ? "선택한 기간에 보관된 기록이 있으면 표시합니다."
              : "기록이 있는 항목부터 비교할 수 있어요."}
          </small>
        </div>
      ) : (
        <>
          <div className={styles.chartSummary}>
            <div>
              <span>
                {histogram
                  ? "도감 등록 계정"
                  : characters
                    ? key === "firsts"
                      ? "첫 캐릭터 등록 합계"
                      : label + " 합계"
                    : label + " 합계"}
              </span>
              <strong>
                {number(total)}
                <small>{unit}</small>
              </strong>
            </div>
            {report.id === "participation" && starts > 0 ? (
              <p>
                시작 {number(starts)}건 중 {number(completed)}건 완료
                <br />
                <b>
                  완료율 {number(Math.round((completed / starts) * 1000) / 10)}%
                </b>
              </p>
            ) : chronological ? (
              <p>
                기록이 있는{" "}
                <b>
                  {active.length}
                  {monthly ? "개월" : "일"}
                </b>
                <br />
                {monthly ? "월별" : "날짜별"} {label} 비교
              </p>
            ) : characters ? (
              <p>
                총 <b>{active.length}종</b>
                <br />
                {key === "firsts"
                  ? "도감 최초 등록 결과 기준"
                  : "캐릭터 간 중복 계정 포함"}
              </p>
            ) : null}
          </div>
          {chronological || histogram ? (
            <div
              className={styles.plotScroll}
              role="region"
              aria-label={report.title + " 그래프"}
              tabIndex={0}
            >
              <div
                className={styles.columns}
                style={{
                  minWidth: Math.max(
                    histogram ? 0 : 280,
                    visible.length * (histogram ? 44 : 62),
                  ),
                }}
              >
                {visible.map((row, i) => {
                  const value = count(row, key);
                  const caption = histogram
                    ? row.cards + "장"
                    : monthly
                      ? String(row.day).slice(0, 7).replace("-", ".")
                      : String(row.day).slice(5).replace("-", ".");
                  return (
                    <div
                      className={styles.column}
                      key={i}
                      aria-label={
                        (histogram
                          ? caption
                          : monthly
                            ? String(row.day).slice(0, 7)
                            : row.day) +
                        ": " +
                        number(value) +
                        unit
                      }
                      tabIndex={0}
                      title={
                        (histogram
                          ? caption
                          : monthly
                            ? String(row.day).slice(0, 7)
                            : row.day) +
                        " · " +
                        label +
                        " " +
                        number(value) +
                        unit
                      }
                    >
                      <div className={styles.columnPlot}>
                        <div
                          className={styles.columnFill}
                          style={{ height: (value / max) * 100 + "%" }}
                        >
                          <b>{number(value)}</b>
                        </div>
                      </div>
                      <span>{caption}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <ol
              className={styles.rankList}
              aria-label={report.title + " 그래프"}
            >
              {visible.map((row, i) => {
                const value = count(row, key);
                const title = String(row.name ?? row.source ?? row.kind ?? "");
                return (
                  <li key={String(row.code ?? row.id ?? title) + i}>
                    <span className={styles.rankNumber}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {characters && (
                      <CharacterFace code={String(row.code ?? "")} />
                    )}
                    <div className={styles.rankBody}>
                      <div className={styles.rankLabel}>
                        <span>
                          {title}
                          {report.id === "goods" && row.character && (
                            <small>
                              {row.character} · {row.kind}
                            </small>
                          )}
                        </span>
                        <strong>
                          {number(value)}
                          <small>{unit}</small>
                        </strong>
                      </div>
                      <div className={styles.rankTrack}>
                        <span style={{ width: (value / max) * 100 + "%" }} />
                      </div>
                      {characters && key === "firsts" && (
                        <small className={styles.rankShare}>
                          등록 계정의{" "}
                          {number(
                            Number(
                              row.share ??
                                Math.round((value / total) * 1000) / 10,
                            ),
                          )}
                          %
                        </small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {chronological && (
            <p className={styles.chartNote}>
              0건인 {monthly ? "달" : "날짜"}는 생략했습니다. 막대 간격은 시간
              간격을 뜻하지 않습니다.
            </p>
          )}
          {histogram && (
            <p className={styles.chartNote}>
              가로: 개봉한 카드 수 · 세로: 계정 수. 해당 계정이 없는 구간은
              생략합니다.
            </p>
          )}
          {!chronological &&
            !histogram &&
            active.length > (compact ? 5 : 8) && (
              <button
                className={styles.textButton}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "접기" : "전체 " + active.length + "개 보기"}
              </button>
            )}
        </>
      )}
    </div>
  );
}
export function OverviewMetrics({ stats }: { stats: AdminStats }) {
  const get = (label: string) =>
    stats.totals.find((item) => item.label === label)?.value;
  const accounts = get("전체 계정") ?? 0;
  const registered = get("도감 등록") ?? 0;
  const average =
    get("평균 수집량") ??
    (registered
      ? Math.round(((get("개봉 카드") ?? 0) / registered) * 10) / 10
      : 0);
  const items = [
    {
      label: "전체 가입 계정",
      value: accounts,
      unit: "계정",
      note: "현재 가입 유지 · 관리자 포함",
    },
    {
      label: "도감 등록",
      value: registered,
      unit: "계정",
      note: accounts
        ? "전체 계정의 " +
          number(Math.round((registered / accounts) * 1000) / 10) +
          "%"
        : "첫 캐릭터를 등록한 계정",
    },
    {
      label: "평균 카드 수집",
      value: average,
      unit: "/ 16장",
      note: "도감 등록 계정 기준",
    },
    {
      label: "도감 완성",
      value: get("16종 완성") ?? 0,
      unit: "계정",
      note: registered
        ? "등록 계정의 " +
          number(
            Math.round(((get("16종 완성") ?? 0) / registered) * 1000) / 10,
          ) +
          "%"
        : "16종 모두 수집한 계정",
    },
  ];
  return (
    <dl className={styles.keyMetrics}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            {number(item.value)}
            <small>{item.unit}</small>
          </dd>
          <p>{item.note}</p>
        </div>
      ))}
    </dl>
  );
}
