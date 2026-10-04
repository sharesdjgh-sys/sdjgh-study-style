"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FAMILIES,
  MODALITIES,
  SITUATIONS,
  SOCIAL_LABELS,
  PACE_LABELS,
  getType,
  type Answers,
  type StudyType,
} from "@/lib/content";
import { readSession, type Session } from "@/lib/storage";
import {
  scoreAnswers,
  axisStrength,
  AXIS_MAX,
  STRENGTH_TEXT,
} from "@/lib/scoring";
import { CharacterCard } from "./character-card";
import { CHARACTERS } from "@/lib/characters";
import { Share } from "./share";
import { MethodToolkit } from "./method-toolkit";
import { Icon } from "./icon";
import { SIGNATURE_METHODS, getMethod } from "@/lib/methods";
import { TypeStory } from "./type-story";
import { MysteryCard } from "./mystery-card";
import { useCollection } from "./collection-provider";
import { CollectionNudge } from "./collection-manager";
import { ResultCardDownload } from "./result-card-download";
import { useAccountResults } from "./account-results-provider";
import { SavedResults } from "./saved-results";
import { useSearchParams } from "next/navigation";
const AXES = [
  {
    key: "social",
    labels: ["혼자", "함께"],
    negative: "혼자 쪽",
    positive: "함께 쪽",
  },
  {
    key: "pace",
    labels: ["즉흥", "계획"],
    negative: "즉흥 쪽",
    positive: "계획 쪽",
  },
] as const;
export function TypeResult({
  type,
  session,
  hideCharacter = false,
}: {
  type: StudyType;
  session?: Session;
  hideCharacter?: boolean;
}) {
  const f = FAMILIES[type.modality];
  const scores = session ? scoreAnswers(session.answers as Answers) : null;
  const chosen =
    scores && Object.values(scores.candidates).some((a) => a.length > 1);
  return (
    <main id="main" className="result-shell">
      <Link href={session ? "/" : "/types"} className="text-link small">
        <Icon name="arrow-left-linear" size={16} />
        {session ? "StudyCrew 홈" : "공부캐 도감"}
      </Link>
      <section className="result-hero">
        <div className="result-copy">
          <span className="eyebrow">
            {session
              ? "발견 완료! 이번에 만난 나의 공부 스타일"
              : "공부캐 도감 · 캐릭터의 공부 스타일"}
          </span>
          <h1>{type.name}</h1>
          {!hideCharacter && (
            <p className="result-character-intro">
              나를 닮은 공부캐는 <strong>{CHARACTERS[type.code].name}</strong>
            </p>
          )}
          {hideCharacter && (
            <p className="notice">
              재검사에서는 유형과 설명만 확인할 수 있어요. 첫 캐릭터와 수집한
              도감은 그대로 유지돼요.
            </p>
          )}
          <p className="result-subtitle">{type.subtitle}</p>
          <div className="tag-row">
            <span>{f.label}</span>
            <span>{SOCIAL_LABELS[type.social]}</span>
            <span>{PACE_LABELS[type.pace]}</span>
          </div>
          <nav className="result-shortcuts" aria-label="결과 자세히 보기">
            <a href="#my-story">
              공부 스타일 이야기 <span>↓</span>
            </a>
            <a href="#study-methods">
              공부법 도구함 <span>↓</span>
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
          <aside className="test-purpose result-caveat">
            <Icon name="stars-linear" size={20} />
            <p>
              <strong>재미로 만난 캐릭터, 나의 가능성은 더 넓어요.</strong>
              <br />
              {session
                ? "다양한 공부 스타일과 공부법을 알아보는 테스트예요. 성격·능력을 진단하지 않아요."
                : "이 페이지는 캐릭터의 공부 스타일 소개예요. 개인 검사 결과는 아니에요."}{" "}
              결과와 상관없이 다른 공부법도 자유롭게 시도해 보세요.
            </p>
          </aside>
          {!session && (
            <Link href="/quiz" className="button primary">
              내 공부캐 찾기
              <Icon name="arrow-right-linear" />
            </Link>
          )}
        </div>
        <div className="result-character">
          {hideCharacter ? (
            <MysteryCard type={type} priority />
          ) : (
            <CharacterCard type={type} priority />
          )}
        </div>
      </section>
      {session && <CollectionNudge />}
      {session && <SavedResults />}
      {session && !hideCharacter && (
        <ResultCardDownload key={session.runId} session={session} />
      )}
      <TypeStory key={type.code} type={type} session={session} />
      {scores && (
        <section className="score-section">
          <div>
            <span className="eyebrow">내 응답 살펴보기</span>
            <h2>
              한 가지 모습만 <br />
              있는 건 아니니까요.
            </h2>
            <p className="muted small">
              같은 상황에서 어떤 방식을 골랐는지 센 횟수예요. <br />
              능력이나 학습 효과가 아니에요.
            </p>
          </div>
          <div className="score-bars">
            <p className="small muted">
              {SITUATIONS.length}가지 상황 중 {FAMILIES[type.modality].label}{" "}
              방식을 {scores.counts[type.modality]}번 골랐어요.
            </p>
            {MODALITIES.map((m) => (
              <div className="score-row" key={m}>
                <span>{FAMILIES[m].label}</span>
                <div>
                  <span
                    style={{
                      transform: `scaleX(${scores.counts[m] / SITUATIONS.length})`,
                    }}
                  />
                </div>
                <span className="mono">
                  {scores.counts[m]} / {SITUATIONS.length}
                </span>
              </div>
            ))}
            {scores.close.modalities.length > 1 && (
              <p className="small">
                {scores.close.modalities
                  .map((m) => FAMILIES[m].label)
                  .join(" · ")}
                을 비슷하게 골랐어요.
              </p>
            )}
            {AXES.map((axis) => {
              const value = scores[axis.key];
              const pole = value > 0 ? axis.positive : axis.negative;
              return (
                <div className="axis-row" key={axis.key}>
                  <div className="axis-labels">
                    <span>{axis.labels[0]}</span>
                    <span>{axis.labels[1]}</span>
                  </div>
                  <div className="axis-track" aria-hidden="true">
                    <span
                      style={{
                        left: `${((value + AXIS_MAX) / (AXIS_MAX * 2)) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="small muted">
                    {pole}에 {STRENGTH_TEXT[axisStrength(value)]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <MethodToolkit type={type} hideCharacter={hideCharacter} />
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
        <h2>다른 공부캐는 이렇게 공부해요.</h2>
        <div className="method-links">
          {MODALITIES.filter((m) => m !== type.modality).map((m) => {
            // 나와 같은 혼자/함께·계획/즉흥 조합인 다른 방식 공부캐의 시그니처
            const id = SIGNATURE_METHODS[`${m}-${type.social}-${type.pace}`];
            const method = getMethod(id);
            return (
              <Link href={`/methods/${id}`} key={m}>
                <Icon name={FAMILIES[m].icon} />
                <span>
                  <strong>{method.name}</strong>
                  <small>
                    {FAMILIES[m].label} 공부캐의 시그니처 · {method.oneLine}
                  </small>
                </span>
                <Icon name="arrow-right-up-linear" />
              </Link>
            );
          })}
        </div>
        <Link className="text-link" href="/methods">
          더 많은 공부법 알아보기
          <Icon name="arrow-right-linear" size={18} />
        </Link>
      </section>
      <section className="share-section" id="share-style">
        <span className="eyebrow">친구의 공부 취향도 궁금하다면</span>
        <h2>“너 무슨 공부캐 나왔어?”</h2>
        <p>
          {hideCharacter
            ? "테스트를 소개하거나 도감에서 처음 만난 캐릭터를 공유해 보세요."
            : "내 캐릭터 한 명만 친구에게 보여줘요. 답변과 상세 점수는 링크에 담지 않아요."}
        </p>
        <Share type={hideCharacter ? undefined : type} />
      </section>
    </main>
  );
}
export function PersonalResult() {
  const { data: collection, loaded: accountLoaded } = useCollection();
  const saved = useAccountResults();
  const search = useSearchParams();
  const [localSession, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSession(readSession());
      setLoaded(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const requestedRun = search.get("run");
  const session = requestedRun
    ? (saved.results.find((s) => s.runId === requestedRun) ??
      (localSession?.runId === requestedRun ? localSession : null))
    : localSession?.result
      ? localSession
      : (saved.results[0] ?? null);
  if (!loaded || !accountLoaded || (!session && !saved.loaded))
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
        <h1>아직 불러올 검사 결과가 없어요.</h1>
        <p>
          검사를 완료하면 나만의 스타일과 공부법을 볼 수 있어요.
          <br />
          로그인한 계정에 저장한 답변과 점수는 다른 기기에서도 불러올 수 있어요.
        </p>
        <SavedResults />
        <Link className="button primary" href="/quiz">
          내 스타일 찾기
          <Icon name="arrow-right-linear" />
        </Link>
        <Link className="text-link" href="/collection">
          내 도감 불러오기 →
        </Link>
      </main>
    );
  return (
    <>
      <TypeResult
        type={type}
        session={session}
        hideCharacter={Boolean(
          session.isRetake ||
          (collection.firstRunId && collection.firstRunId !== session.runId),
        )}
      />
      <div className="result-reset">
        <Link href="/quiz" className="text-link">
          다시 검사하기
          <Icon name="restart-linear" size={17} />
        </Link>
      </div>
    </>
  );
}
