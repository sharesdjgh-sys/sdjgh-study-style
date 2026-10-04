"use client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
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
import type { Session } from "@/lib/storage";
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
import { ResultCardDownload } from "./result-card-download";
import { useAccountResults } from "./account-results-provider";
import { SavedResults } from "./saved-results";
import { useRouter, useSearchParams } from "next/navigation";
import { useSavedSession } from "./use-saved-session";
import { useAuth } from "./auth-provider";
import styles from "./result.module.css";
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
  context,
  characterPending = false,
  resultLabel,
  cardSession,
}: {
  type: StudyType;
  session?: Session;
  hideCharacter?: boolean;
  context?: ReactNode;
  characterPending?: boolean;
  resultLabel?: string;
  cardSession?: Session;
}) {
  const { data: collection } = useCollection();
  const f = FAMILIES[type.modality];
  const scores = session ? scoreAnswers(session.answers as Answers) : null;
  const chosen =
    scores && Object.values(scores.candidates).some((a) => a.length > 1);
  return (
    <main
      id="main"
      className={`result-shell ${session ? styles.page : ""}`}
      data-family={type.modality}
    >
      <Link href={session ? "/" : "/types"} className="text-link small">
        <Icon name="arrow-left-linear" size={16} />
        {session ? "StudyCrew 홈" : "공부캐 도감"}
      </Link>
      {resultLabel && <p className={styles.sourceLine}>{resultLabel}</p>}
      <section className="result-hero">
        <div className="result-copy">
          <span className="eyebrow">
            {session
              ? characterPending
                ? "이번 검사에서 살펴본 나의 공부 취향"
                : hideCharacter
                  ? "다시 살펴본 나의 공부 취향"
                  : "처음 만난 나의 공부 친구"
              : "공부캐 도감 · 캐릭터의 공부 스타일"}
          </span>
          <h1>{type.name}</h1>
          {!hideCharacter && (
            <p className="result-character-intro">
              나를 닮은 공부캐는 <strong>{CHARACTERS[type.code].name}</strong>
            </p>
          )}
          {hideCharacter && !characterPending && (
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
            {cardSession && (
              <a href="#my-character-card">
                내 캐릭터 카드 저장 <span>→</span>
              </a>
            )}
            <a href="#my-story">
              공부 스타일 이야기 <span>↓</span>
            </a>
            <a href="#study-methods">
              공부법 도구함 <span>↓</span>
            </a>
            {session && (
              <a href="#my-scores">
                내 응답 살펴보기 <span>↓</span>
              </a>
            )}
            <a href="#share-style">
              친구에게 보여주기 <span>↗</span>
            </a>
          </nav>
          <details className={styles.explanation}>
            <summary>이 결과는 어떻게 읽으면 좋을까요?</summary>
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
          </details>
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
      {context}
      {session && (
        <section className={styles.storage} aria-label="결과 보관 안내">
          <Image
            src="/ui-icons/nav-account.webp"
            alt=""
            width={48}
            height={48}
          />
          <div>
            <h2>나의 기록, 다음에도 이어서</h2>
            <SavedResults />
          </div>
          <Link className="button secondary" href="/account">
            내 정보·검사 기록 →
          </Link>
          <Link className="text-link" href="/collection">
            {collection.firstType
              ? "내 도감과 초대 코드 보기 →"
              : "내 도감 시작하기 →"}
          </Link>
        </section>
      )}
      {cardSession && (
        <ResultCardDownload
          key={`download:${cardSession.runId}`}
          session={cardSession}
        />
      )}
      <TypeStory
        key={`story:${session?.runId ?? type.code}`}
        type={type}
        session={session}
      />
      {scores && (
        <section className="score-section" id="my-scores">
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
              <div className="score-row" key={m} data-family={m}>
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
      <MethodToolkit
        key={`methods:${session?.runId ?? type.code}`}
        type={type}
        hideCharacter={hideCharacter}
        resultRunId={session?.runId}
      />
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
      {session && (
        <nav className={styles.actions} aria-label="결과 다음 행동">
          <Link href="/quiz" className="button secondary">
            다시 검사하기 <Icon name="restart-linear" size={17} />
          </Link>
          <Link href="/account" className="text-link">
            내 검사 기록 보기 →
          </Link>
        </nav>
      )}
    </main>
  );
}
function ResultState({
  title,
  children,
  busy = false,
}: {
  title: string;
  children?: ReactNode;
  busy?: boolean;
}) {
  return (
    <main id="main" className={`result-shell ${styles.state}`} aria-busy={busy}>
      <Image
        src="/ui-icons/nav-character.webp"
        alt=""
        width={112}
        height={112}
      />
      <span className="eyebrow">나의 공부 이야기</span>
      <h1 role={busy ? "status" : undefined}>{title}</h1>
      {children}
    </main>
  );
}

export function PersonalResult() {
  const auth = useAuth();
  const {
    data: collection,
    loaded: accountLoaded,
    error: collectionError,
    refresh: refreshCollection,
  } = useCollection();
  const saved = useAccountResults();
  const local = useSavedSession();
  const search = useSearchParams();
  const router = useRouter();
  const signedIn = auth.session.signedIn;
  const requestedRun = search.get("run");
  const localResults = [local.session, local.first].filter((s): s is Session =>
    Boolean(s?.result),
  );
  // Only the current account's API can verify ownership of a browser result.
  const results = [
    ...new Map(
      (signedIn ? saved.results : localResults).map((s) => [s.runId, s]),
    ).values(),
  ].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const session =
    requestedRun !== null
      ? results.find((s) => s.runId === requestedRun)
      : results[0];
  if (
    !local.loaded ||
    (auth.status === "checking" && !signedIn) ||
    (signedIn && !saved.loaded && !results.length)
  )
    return (
      <ResultState title="내 결과를 불러오고 있어요." busy>
        <p>로그인 상태와 보관한 검사 기록을 확인하고 있어요.</p>
      </ResultState>
    );
  if (auth.status === "error")
    return (
      <ResultState title="로그인 상태를 확인하지 못했어요.">
        <p>
          다른 계정의 기록이 섞이지 않도록, 계정을 확인한 뒤 결과를 보여드려요.
        </p>
        <button className="button primary" onClick={() => void auth.refresh()}>
          로그인 상태 다시 확인
        </button>
      </ResultState>
    );
  const type = session?.result ? getType(session.result) : null;
  if (!type || !session) {
    const missing = requestedRun !== null;
    const failed =
      signedIn && Boolean(saved.loadError || (!missing && saved.error));
    return (
      <ResultState
        title={
          failed
            ? "검사 기록을 확인하지 못했어요."
            : missing
              ? "요청한 검사 기록을 찾을 수 없어요."
              : "아직 완료한 검사 결과가 없어요."
        }
      >
        <p>
          {failed
            ? "결과가 삭제된 것은 아니에요. 연결을 확인하고 다시 불러와 주세요."
            : missing
              ? "이 브라우저 또는 현재 계정에서 볼 수 있는 기록인지 확인해 주세요."
              : "검사를 마치면 나의 공부캐와 응답, 추천 공부법을 여기서 볼 수 있어요."}
        </p>
        {signedIn ? (
          <SavedResults />
        ) : (
          <>
            <p>
              다른 기기에 저장한 결과는 같은 카카오 계정으로 로그인하면 볼 수
              있어요.
            </p>
            <button
              className="button primary"
              disabled={auth.busy || !auth.session.configured}
              onClick={() => void auth.login()}
            >
              카카오 로그인
            </button>
            {!auth.session.configured && (
              <p className="small muted">카카오 로그인을 준비 중이에요.</p>
            )}
          </>
        )}
        <div className="button-row">
          {missing && results.length > 0 && (
            <Link className="button secondary" href="/result">
              최근 결과 보기
            </Link>
          )}
          <Link className="button secondary" href="/quiz">
            {local.session && !local.session.result
              ? "진행 중인 검사 이어하기"
              : "내 스타일 찾기"}
          </Link>
          <Link className="text-link" href="/account">
            내 정보·검사 기록 →
          </Link>
        </div>
      </ResultState>
    );
  }
  const characterPending = signedIn && (!accountLoaded || collectionError);
  const firstRun = signedIn ? collection.firstRunId : local.first?.runId;
  // A retake changes the analysis, never the original character keepsake.
  // Signed-in candidates come exclusively from the current account's API.
  const cardSession = firstRun
    ? results.find((result) => result.runId === firstRun)
    : results.findLast((result) => !result.isRetake);
  const hideCharacter =
    characterPending ||
    Boolean(firstRun ? firstRun !== session.runId : session.isRetake);
  return (
    <TypeResult
      key={`${signedIn ? collection.accountId : "browser"}:${session.runId}`}
      type={type}
      session={session}
      cardSession={cardSession}
      hideCharacter={hideCharacter}
      characterPending={characterPending}
      resultLabel={`${signedIn ? "계정에 보관한 결과" : "이 브라우저의 결과"} · ${new Date(session.completedAt!).toLocaleDateString("ko-KR")}${saved.loadError ? " · 최신 기록 확인 필요" : ""}`}
      context={
        <>
          {results.length > 1 && (
            <div className={styles.toolbar}>
              <div>
                <span className={styles.source}>
                  {signedIn ? "계정에 보관한 결과" : "이 브라우저의 결과"}
                </span>
                <p>
                  {new Date(session.completedAt!).toLocaleString("ko-KR")} ·{" "}
                  {characterPending
                    ? "도감 확인 중"
                    : hideCharacter
                      ? "재검사"
                      : "첫 발견"}
                </p>
              </div>
              {results.length > 1 && (
                <label>
                  보고 있는 검사
                  <select
                    aria-label="검사 기록 선택"
                    value={session.runId}
                    onChange={(event) =>
                      router.replace(
                        `/result?run=${encodeURIComponent(event.target.value)}`,
                        { scroll: false },
                      )
                    }
                  >
                    {results.map((s) => (
                      <option key={s.runId} value={s.runId}>
                        {new Date(s.completedAt!).toLocaleString("ko-KR")} ·{" "}
                        {getType(s.result!)?.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {saved.loadError && (
            <div className={styles.status} role="status">
              <p>
                최신 기록을 확인하지 못해 마지막으로 불러온 결과를 보여드려요.
              </p>
              <button className="button secondary" onClick={saved.refresh}>
                최신 기록 다시 확인
              </button>
            </div>
          )}
          {characterPending && (
            <div className={styles.status} role="status">
              <p>
                {collectionError
                  ? "도감 정보를 불러오지 못했어요. 검사 결과는 확인할 수 있고, 캐릭터 공개 여부는 다시 확인할게요."
                  : "도감에서 처음 만난 캐릭터를 확인하고 있어요."}
              </p>
              {collectionError && (
                <button
                  className="button secondary"
                  onClick={() => void refreshCollection()}
                >
                  도감 다시 확인
                </button>
              )}
            </div>
          )}
          {!signedIn && (
            <p className={styles.localNote}>
              이 기기에 보관한 결과예요. 계정에 보관하려면 로그인해 주세요.
            </p>
          )}
        </>
      }
    />
  );
}
