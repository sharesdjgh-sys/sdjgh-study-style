"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QUESTIONS,
  VERSION,
  QUESTION_GUIDES,
  FAMILIES,
  type Answer,
  type Answers,
  type PairAnswer,
  getType,
} from "@/lib/content";
import { scoreAnswers, resolveType, type Choices } from "@/lib/scoring";
import {
  readSession,
  newSession,
  saveSession,
  rememberFirstSession,
  type Session,
} from "@/lib/storage";
import { track } from "@/lib/telemetry";
import { Icon } from "./icon";
import { Arrow } from "./shell";
import { useConfirm } from "./ui/confirm-dialog";
import { TypeDiscovery } from "./type-discovery";
import { useCollection } from "./collection-provider";
import { useAccountResults } from "./account-results-provider";
import styles from "./quiz.module.css";
import { QuizIntro } from "./quiz-intro";
const CONSENT_VERSION = `${VERSION}:intro-v1`;
const CONSENT_KEY = "study-style:quiz-consent";
const TOTAL = QUESTIONS.length;
const LAST = TOTAL - 1;
const ENCOURAGEMENTS = [
  "첫 느낌대로 골라요. 정답은 없으니까!",
  "취향 조각이 모이고 있어요. 조금 더 알아볼까요?",
  "벌써 절반을 넘었어요! 나다운 공부 모습이 보이기 시작해요.",
  "거의 다 왔어요. 어떤 카드가 나올까요?",
  "마지막 두 조각만 남았어요!",
];
const PAIR_SIDES = [
  {
    side: "top",
    choices: [
      { value: 1, label: "훨씬 가까워요", name: "위 문장에 훨씬 가까워요" },
      {
        value: 2,
        label: "조금 더 가까워요",
        name: "위 문장에 조금 더 가까워요",
      },
    ],
  },
  {
    side: "bottom",
    choices: [
      {
        value: 3,
        label: "조금 더 가까워요",
        name: "아래 문장에 조금 더 가까워요",
      },
      { value: 4, label: "훨씬 가까워요", name: "아래 문장에 훨씬 가까워요" },
    ],
  },
] as const satisfies readonly {
  side: "top" | "bottom";
  choices: readonly { value: PairAnswer; label: string; name: string }[];
}[];
export function Quiz() {
  const router = useRouter();
  const { data: collection, loaded: collectionLoaded } = useCollection();
  const saved = useAccountResults();
  const hasPreviousResult = Boolean(
    collection.firstType || saved.results.length,
  );
  const [session, setSession] = useState<Session | null>(null);
  const [acceptedRun, setAcceptedRun] = useState<string | null>(null);
  const [ties, setTies] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [direction, setDirection] = useState("next");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [confirm, dialog] = useConfirm();
  const heading = useRef<HTMLHeadingElement>(null);
  const progressHeading = useRef<HTMLDivElement>(null);
  const scrollToNextQuestion = useRef(false);
  useEffect(() => {
    router.prefetch("/result");
  }, [router]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const s = readSession() ?? newSession();
      setSession(s);
      try {
        if (
          sessionStorage.getItem(CONSENT_KEY) ===
          `${CONSENT_VERSION}:${s.runId}`
        )
          setAcceptedRun(s.runId);
      } catch {
        /* In-memory consent still allows this visit to continue. */
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (heading.current && window.matchMedia("(max-width: 767px)").matches) {
      scrollToNextQuestion.current = false;
      heading.current.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (scrollToNextQuestion.current) {
      scrollToNextQuestion.current = false;
      heading.current?.focus({ preventScroll: true });
      progressHeading.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    } else {
      heading.current?.focus();
    }
  }, [session?.index, ties, acceptedRun]);
  function acceptIntro() {
    if (!session) return;
    try {
      sessionStorage.setItem(
        CONSENT_KEY,
        `${CONSENT_VERSION}:${session.runId}`,
      );
    } catch {
      /* Ask again after reload if session storage is unavailable. */
    }
    setAcceptedRun(session.runId);
    update(session);
    track(session, "start");
    track(session, "question", String(session.index + 1));
  }
  function update(s: Session) {
    setSession(s);
    if (!saveSession(s))
      setWarning("답변은 이 창에서만 유지돼요. 완료 전까지 창을 닫지 마세요.");
  }
  function finish(s: Session, completedAt: number) {
    const missing = QUESTIONS.findIndex((question) => !s.answers[question.id]);
    if (missing !== -1) {
      update({ ...s, index: missing });
      setTies(false);
      setError("아직 답하지 않은 문항이 있어요. 이 질문부터 확인해 주세요.");
      return;
    }
    const scores = scoreAnswers(s.answers as Answers);
    const code = resolveType(scores, s.choices);
    if (!code) {
      setTies(true);
      return;
    }
    const completed = {
      ...s,
      result: code,
      completedAt,
      updatedAt: completedAt,
      isRetake: Boolean(s.isRetake || hasPreviousResult),
    };
    update(completed);
    rememberFirstSession(completed);
    track(completed, "complete");
    setDiscovering(true);
  }
  function answer(id: string, value: Answer, updatedAt: number) {
    if (!session) return;
    setError("");
    update({
      ...session,
      answers: { ...session.answers, [id]: value },
      choices: {},
      updatedAt,
    });
  }
  function navigateQuestion(index: number, updatedAt: number) {
    if (!session) return;
    setError("");
    setDirection(index > session.index ? "next" : "previous");
    scrollToNextQuestion.current = true;
    const next = { ...session, index, updatedAt };
    update(next);
    track(next, "question", String(index + 1));
  }
  function handlePrevious(updatedAt: number) {
    if (session) navigateQuestion(session.index - 1, updatedAt);
  }
  function handleNext(updatedAt: number) {
    if (!session) return;
    if (!session.answers[QUESTIONS[session.index].id]) {
      setError("답을 하나 골라주세요.");
      return;
    }
    if (session.index === LAST) finish(session, updatedAt);
    else navigateQuestion(session.index + 1, updatedAt);
  }
  async function restart() {
    if (
      await confirm({
        title: "새로 시작할까요?",
        description: `${TOTAL}개의 질문에 새롭게 답할 수 있어요.`,
        note: "재검사에서는 캐릭터를 실루엣으로 가리고 유형과 설명만 보여줘요. 처음 만난 캐릭터와 저장된 도감은 유지되고 새 캐릭터가 추가되지는 않아요.",
        confirmLabel: "새로 시작",
        tone: "danger",
      })
    ) {
      const s = newSession();
      setSession(s);
      setAcceptedRun(null);
      setTies(false);
    }
  }
  if (!session || !collectionLoaded || !saved.loaded)
    return (
      <main id="main" className={`quiz-shell ${styles.page}`}>
        <div className="loading-state" role="status">
          <span className="loading-dot" />
          질문을 준비하고 있어요.
        </div>
      </main>
    );
  if (discovering && session.result) {
    const type = getType(session.result);
    if (type)
      return (
        <TypeDiscovery
          type={type}
          revealCharacter={!session.isRetake}
          onComplete={() => router.replace("/result")}
        />
      );
  }
  if (session.result)
    return (
      <main id="main" className="empty-state">
        <span className="eyebrow">다시 만나 반가워요</span>
        <h1>발견한 공부 취향이 있어요.</h1>
        <p>지난 결과를 다시 보거나 지금의 취향을 새로 살펴보세요.</p>
        <div className="button-row">
          <Link className="button primary" href="/result">
            내 결과 보기
            <Arrow />
          </Link>
          <button className="button secondary" onClick={restart}>
            다시 검사하기
          </button>
        </div>
        {dialog}
      </main>
    );
  if (acceptedRun !== session.runId)
    return (
      <QuizIntro
        key={session.runId}
        resume={Object.keys(session.answers).length > 0}
        onAccept={acceptIntro}
      />
    );
  const q = QUESTIONS[session.index];
  const count = Object.keys(session.answers).length;
  const scores = ties ? scoreAnswers(session.answers as Answers) : null;
  const firstOfKind =
    QUESTIONS.findIndex((question) => question.kind === q.kind) ===
    session.index;
  const choose = (key: keyof Choices, value: string) =>
    update({ ...session, choices: { ...session.choices, [key]: value } });
  return (
    <main id="main" className={`quiz-shell quiz-active ${styles.page}`}>
      <div className="quiz-top">
        <Link href="/" className={styles.homeLink} aria-label="StudyCrew 홈">
          <Image
            className={styles.homeCards}
            src="/brand/study-friends-v2-192.png"
            alt=""
            width={192}
            height={192}
            sizes="34px"
            loading="eager"
          />
          <Image
            src="/brand/studycrew-wordmark-book.webp"
            alt="StudyCrew"
            width={900}
            height={245}
            sizes="104px"
            loading="eager"
          />
        </Link>
        <span>
          <Icon name="shield-check-linear" size={16} />
          {collection.signedIn
            ? "결과를 내 계정에 보관해요"
            : "로그인 없이도 검사할 수 있어요"}
        </span>
      </div>
      <div ref={progressHeading} className="progress-heading">
        <span>{ties ? "마지막으로, 하나만 골라주세요" : "내 공부캐 찾기"}</span>
        <strong>
          {ties ? TOTAL : String(session.index + 1).padStart(2, "0")}
          <span> / {TOTAL}</span>
        </strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="응답 진행률"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={TOTAL}
      >
        <span style={{ transform: `scaleX(${count / TOTAL})` }} />
      </div>
      <p
        className="quiz-encouragement"
        key={`encourage-${ties ? "ties" : Math.floor(session.index / 5)}`}
      >
        <span aria-hidden="true">✦</span>{" "}
        {ties
          ? "마지막 취향 한 조각, 직접 골라볼까요?"
          : ENCOURAGEMENTS[
              Math.min(ENCOURAGEMENTS.length - 1, Math.floor(session.index / 5))
            ]}
      </p>
      <section
        className="question-card"
        data-direction={direction}
        data-kind={ties ? "ties" : q.kind}
        key={ties ? "ties" : q.id}
      >
        {!ties ? (
          <>
            <div className={`quiz-question-body ${styles.questionBody}`}>
              <div className="question-meta">
                <span className="question-number">
                  질문 {String(session.index + 1).padStart(2, "0")}
                </span>
                <span className="question-kind">
                  {q.kind === "situation" ? "상황 고르기" : "두 문장 비교"}
                </span>
              </div>
              <h1 ref={heading} tabIndex={-1}>
                {q.text}
              </h1>
              <p className="question-hint">{q.hint}</p>
              {firstOfKind && (
                <details className="question-guide" open={q.kind === "pair"}>
                  <summary>
                    {q.kind === "situation"
                      ? "하나만 고르기 어려운가요?"
                      : "두 문장은 어떻게 고르나요?"}
                  </summary>
                  <p>{QUESTION_GUIDES[q.kind]}</p>
                </details>
              )}
              {q.kind === "situation" ? (
                <fieldset className="situation-options">
                  <legend className="sr-only">
                    가장 먼저 손이 가는 방법 하나를 골라 주세요
                  </legend>
                  {q.options.map((option) => (
                    <label
                      className={`situation-option ${session.answers[q.id] === option.modality ? "checked" : ""}`}
                      key={option.modality}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option.modality}
                        checked={session.answers[q.id] === option.modality}
                        onChange={() =>
                          answer(q.id, option.modality, Date.now())
                        }
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <fieldset className="pair-options">
                  <legend className="sr-only">
                    두 문장 중 요즘의 나에게 더 가까운 쪽을 골라 주세요
                  </legend>
                  {PAIR_SIDES.map(({ side, choices }, i) => (
                    <div
                      className={`pair-card ${choices.some((c) => c.value === session.answers[q.id]) ? "chosen" : ""}`}
                      key={side}
                    >
                      {i === 1 && (
                        <span className="pair-divider" aria-hidden="true">
                          또는
                        </span>
                      )}
                      <p className="pair-statement" id={`${q.id}-${side}`}>
                        <span className={styles.statementLabel}>
                          {i === 0 ? "위 문장" : "아래 문장"}
                        </span>
                        {q[side].text}
                      </p>
                      <div className="pair-choices">
                        {choices.map((choice) => (
                          <label
                            className={`pair-choice ${session.answers[q.id] === choice.value ? "checked" : ""}`}
                            key={choice.value}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={choice.value}
                              aria-label={choice.name}
                              aria-describedby={`${q.id}-${side}`}
                              checked={session.answers[q.id] === choice.value}
                              onChange={() =>
                                answer(q.id, choice.value, Date.now())
                              }
                            />
                            <span aria-hidden="true">{choice.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </fieldset>
              )}
            </div>
            <div className="quiz-controls">
              <button
                className="button ghost"
                disabled={session.index === 0}
                onClick={() => {
                  // eslint-disable-next-line react-hooks/purity -- Timestamp is read only on a user click, never during render.
                  handlePrevious(Date.now());
                }}
              >
                <Icon name="arrow-left-linear" size={18} />
                이전
              </button>
              <button
                className="button primary"
                onClick={() => {
                  // eslint-disable-next-line react-hooks/purity -- Timestamp is read only on a user click, never during render.
                  handleNext(Date.now());
                }}
              >
                {session.index === LAST ? "내 결과 보기" : "다음 질문"}
                <Arrow />
              </button>
            </div>
          </>
        ) : (
          scores && (
            <>
              <div className={`quiz-question-body ${styles.questionBody}`}>
                <span className="question-number">
                  여러 방식을 비슷하게 골랐어요
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  다음 공부 시간에
                  <br />
                  하나만 해 본다면?
                </h1>
                <p className="question-hint">
                  추가 점수는 없어요. 고른 방식을 대표 스타일로 보여 드릴게요.
                  {scores.uniform &&
                    " 네 방식을 고르게 골랐어요. 어떤 방법이든 시작점이 될 수 있어요."}
                </p>
                <fieldset className="tie-group">
                  <legend>먼저 해보고 싶은 활동</legend>
                  {scores.candidates.modality.map((m) => (
                    <label
                      className={`tie-choice ${session.choices.modality === m ? "checked" : ""}`}
                      key={m}
                    >
                      <input
                        type="radio"
                        name="modality"
                        checked={session.choices.modality === m}
                        onChange={() => choose("modality", m)}
                      />
                      <Icon name={FAMILIES[m].icon} />
                      {FAMILIES[m].activity}
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="quiz-controls">
                <button
                  className="button ghost"
                  onClick={() => {
                    setTies(false);
                    setError("");
                  }}
                >
                  답변 수정
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    if (!resolveType(scores, session.choices)) {
                      setError("활동을 하나 골라주세요.");
                      return;
                    }
                    finish(session, Date.now());
                  }}
                >
                  내 결과 보기
                  <Arrow />
                </button>
              </div>
            </>
          )
        )}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className={`quiz-signature ${styles.signature}`}>
          <Image
            src="/brand/sdj-logo.png"
            alt="서대전여자고등학교"
            width={2830}
            height={449}
            sizes="132px"
            loading="eager"
          />
          <Image
            src="/brand/lifeprofessor-logo.png"
            alt="인생교수의 AI 연구소"
            width={399}
            height={67}
            sizes="132px"
            loading="eager"
          />
        </div>
      </section>
      <p className="quiz-footnote">
        정답은 없어요. 최근 2주 동안의 나를 떠올려 보세요.
      </p>
      {warning && (
        <p className="notice" role="status">
          {warning}
        </p>
      )}
      {dialog}
    </main>
  );
}
