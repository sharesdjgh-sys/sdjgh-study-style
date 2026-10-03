"use client";
import Link from "next/link";
import { useAccountResults } from "./account-results-provider";
import { useCollection } from "./collection-provider";
import { getType } from "@/lib/content";

export function SavedResults({ history = false }: { history?: boolean }) {
  const { data } = useCollection();
  const { results, loaded, error, saving, refresh } = useAccountResults();
  if (!data.signedIn)
    return (
      <p className="result-save-status small">
        카카오 로그인하면 검사 답변과 점수가 계정에 저장돼요.{" "}
        <Link href="/collection">로그인하고 보관하기 →</Link>
      </p>
    );
  return (
    <section className="saved-results" aria-label="계정에 저장한 검사 결과">
      {history && <h2>내 검사 기록</h2>}
      <p role="status">
        {saving || !loaded
          ? "검사 결과를 계정과 연결하고 있어요…"
          : error ||
            (results.length
              ? "검사 답변과 점수를 계정에 보관했어요. 다른 기기에서도 다시 볼 수 있어요."
              : "아직 계정에 저장한 검사 결과가 없어요.")}
      </p>
      {error && (
        <button className="button secondary" onClick={refresh}>
          결과 저장·불러오기 다시 시도
        </button>
      )}
      {history && results.length > 0 && (
        <ul className="saved-results-list">
          {results.map((s) => (
            <li key={s.runId}>
              <Link href={`/result?run=${s.runId}`}>
                <span>{getType(s.result!)?.name}</span>
                <small>
                  {s.runId === data.firstRunId ? "첫 발견 · " : ""}
                  {new Date(s.completedAt!).toLocaleDateString("ko-KR")} →
                </small>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {history && (
        <p className="small muted">
          최근 100개 검사와 첫 도감 등록 결과를 표시해요. 예전에 기기에만
          보관하다 만료된 답변은 복원할 수 없어요.
        </p>
      )}
    </section>
  );
}
