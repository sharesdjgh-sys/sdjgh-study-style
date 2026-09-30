"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FAMILIES,
  MODALITIES,
  SOCIAL_LABELS,
  PACE_LABELS,
  getType,
  type Answers,
  type StudyType,
} from "@/lib/content";
import { readSession, clearSession, type Session } from "@/lib/storage";
import { scoreAnswers } from "@/lib/scoring";
import { StudyArt } from "./study-art";
import { Share } from "./share";
import { Mission } from "./mission";
import { Icon } from "./icon";
import { useConfirm } from "./ui/confirm-dialog";
import { TypeStory } from "./type-story";
export function TypeResult({
  type,
  session,
}: {
  type: StudyType;
  session?: Session;
}) {
  const f = FAMILIES[type.modality];
  const scores = session ? scoreAnswers(session.answers as Answers) : null;
  const chosen =
    scores && Object.values(scores.candidates).some((a) => a.length > 1);
  return (
    <main id="main" className="result-shell">
      <Link href={session ? "/" : "/types"} className="text-link small">
        <Icon name="arrow-left-linear" size={16} />
        {session ? "공부결 홈" : "스타일 도감"}
      </Link>
      <section className="result-hero">
        <div className="result-copy">
          <span className="eyebrow">
            {session
              ? "발견했어요, 나의 공부 취향"
              : "스타일 도감 · 대표 스타일 소개"}
          </span>
          <h1>{type.name}</h1>
          <p className="result-subtitle">{type.subtitle}</p>
          <div className="tag-row">
            <span>{f.label}</span>
            <span>{SOCIAL_LABELS[type.social]}</span>
            <span>{PACE_LABELS[type.pace]}</span>
          </div>
          <nav className="result-shortcuts" aria-label="결과 자세히 보기">
            <a href="#my-story">
              나 사용설명서 <span>↓</span>
            </a>
            <a href="#share-style">
              친구에게 보여주기 <span>↗</span>
            </a>
          </nav>
          <p className="result-explanation">
            {f.summary}{" "}
            {type.social === "solo"
              ? "혼자 생각할 시간을 확보하고"
              : "서로 생각을 나눌 기회를 만들고"}
            ,{" "}
            {type.pace === "planned"
              ? "순서를 정해두면 시작하기 편할 수 있어요."
              : "그때의 상황에 맞춰 순서를 조절해 보세요."}
          </p>
          {chosen && (
            <p className="notice">
              비슷한 후보 중 직접 선택한 대표 스타일이에요.
            </p>
          )}
          <p className="result-caveat">
            {session
              ? "이번 응답을 바탕으로 고른 공부법 후보예요."
              : "이 페이지는 공개된 유형 소개예요. 개인 검사 결과는 아니에요."}{" "}
            과목과 상황에 따라 다른 방법도 시도해 보세요.
          </p>
          {!session && (
            <Link href="/quiz" className="button primary">
              내 스타일도 알아보기
              <Icon name="arrow-right-linear" />
            </Link>
          )}
        </div>
        <div className="result-art">
          <span className="card-topline">
            공부결 취향 카드 <span>{f.label}</span>
          </span>
          <StudyArt modality={type.modality} asset={type.asset} />
          <div className="result-art-footer">
            공부에도, 나만의 결이 있으니까.
          </div>
        </div>
      </section>
      <TypeStory key={type.code} type={type} session={session} />
      {scores && (
        <section className="score-section">
          <div>
            <span className="eyebrow">내 응답 살펴보기</span>
            <h2>
              한 가지 모습만
              <br />
              있는 건 아니니까요.
            </h2>
            <p className="muted small">
              점수는 선호의 응답 합계예요.
              <br />
              능력이나 학습 효과의 확률이 아니에요.
            </p>
          </div>
          <div className="score-bars">
            {MODALITIES.map((m) => (
              <div className="score-row" key={m}>
                <span>{FAMILIES[m].label}</span>
                <div>
                  <span
                    style={{
                      transform: `scaleX(${scores.totals[m] / 15})`,
                    }}
                  />
                </div>
                <span className="mono">{scores.totals[m]} / 15</span>
              </div>
            ))}
            {scores.close.modalities.length > 1 && (
              <p className="small">
                {scores.close.modalities
                  .map((m) => FAMILIES[m].label)
                  .join(" · ")}
                을 비슷하게 선호했어요.
              </p>
            )}
            {(scores.close.social || scores.close.pace) && (
              <p className="small muted">
                {scores.close.social ? "혼자/함께" : ""}
                {scores.close.social && scores.close.pace ? ", " : ""}
                {scores.close.pace ? "계획/즉흥" : ""} 성향도 차이가 작아요.
                상황에 맞춰 바꿔보세요.
              </p>
            )}
          </div>
        </section>
      )}
      <Mission modality={type.modality} type={type} />
      <section className="next-review">
        <Icon name="calendar-linear" size={32} />
        <div>
          <h3>내일 한 번 더, 짧게 꺼내보세요.</h3>
          <p>
            오늘 공부한 내용을 보지 않고 떠올려 보세요. 어려웠던 부분을 확인하고
            다시 시도해요. 다음 날은 시작을 위한 제안이며, 과목마다 간격을
            조절해도 좋아요.
          </p>
        </div>
      </section>
      <section className="alternatives">
        <span className="eyebrow">다른 방법도 내 것이 될 수 있어요</span>
        <h2>이런 공부법도 있어요.</h2>
        <div className="method-links">
          {MODALITIES.filter((m) => m !== type.modality).map((m) => (
            <Link href={`/methods/${m}`} key={m}>
              <Icon name={FAMILIES[m].icon} />
              <span>
                <strong>{FAMILIES[m].activity}</strong>
                <small>{FAMILIES[m].detail}</small>
              </span>
              <Icon name="arrow-right-up-linear" />
            </Link>
          ))}
        </div>
      </section>
      <section className="share-section" id="share-style">
        <span className="eyebrow">친구의 공부 취향도 궁금하다면</span>
        <h2>다른 취향, 같은 응원.</h2>
        <p>대표 스타일만 공유돼요. 답변과 상세 점수는 링크에 담지 않아요.</p>
        <Share type={type} />
      </section>
    </main>
  );
}
export function PersonalResult() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirm, dialog] = useConfirm();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSession(readSession());
      setLoaded(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  if (!loaded)
    return (
      <main id="main" className="empty-state" role="status">
        내 결과를 불러오고 있어요.
      </main>
    );
  const type = session?.result ? getType(session.result) : null;
  if (!type || !session)
    return (
      <main id="main" className="empty-state">
        <span className="eyebrow">새로운 발견을 시작해요</span>
        <h1>아직 이 기기에 결과가 없어요.</h1>
        <p>
          검사를 완료하면 나만의 스타일과 공부법을 볼 수 있어요.
          <br />
          저장 기간이 지났거나 다른 브라우저에서는 다시 검사해 주세요.
        </p>
        <Link className="button primary" href="/quiz">
          내 스타일 찾기
          <Icon name="arrow-right-linear" />
        </Link>
      </main>
    );
  return (
    <>
      <TypeResult type={type} session={session} />
      <div className="result-reset">
        <Link href="/quiz" className="text-link">
          다시 검사하기
          <Icon name="restart-linear" size={17} />
        </Link>
        <button
          className="text-link muted"
          onClick={async () => {
            if (
              await confirm({
                title: "이 기기의 기록을 지울까요?",
                description: "저장된 검사 1회와 선택한 활동 기록을 지워요.",
                note: "삭제한 기기 기록은 복구할 수 없어요. 이미 전송된 이용 통계는 정해진 보관 기간에 따라 처리돼요.",
                confirmLabel: "기록 지우기",
                tone: "danger",
              })
            ) {
              clearSession();
              setSession(null);
            }
          }}
        >
          이 기기의 기록 지우기
        </button>
      </div>
      {dialog}
    </>
  );
}
