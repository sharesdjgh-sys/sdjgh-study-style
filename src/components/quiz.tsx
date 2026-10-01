"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QUESTIONS,
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
  const [session, setSession] = useState<Session | null>(null);
  const [ties, setTies] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [direction, setDirection] = useState("next");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [confirm, dialog] = useConfirm();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    router.prefetch("/result");
  }, [router]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const s = readSession() ?? newSession();
      setSession(s);
      if (!s.result) {
        if (!saveSession(s))
          setWarning(
            "이 브라우저에서는 이어하기 저장이 어려워요. 이 창에서 계속 진행해 주세요.",
          );
        track(s, "start");
        track(s, "question", String(s.index + 1));
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [session?.index, ties]);
  function update(s: Session) {
    setSession(s);
    if (!saveSession(s))
      setWarning("답변은 이 창에서만 유지돼요. 완료 전까지 창을 닫지 마세요.");
  }
  function finish(s: Session) {
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
      completedAt: Date.now(),
      updatedAt: Date.now(),
      isRetake: Boolean(s.isRetake || collection.firstType),
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
      update(s);
      setTies(false);
      track(s, "start");
      track(s, "question", "1");
    }
  }
  if (!session || !collectionLoaded)
    return (
      <main id="main" className="quiz-shell">
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
  const q = QUESTIONS[session.index];
  const count = Object.keys(session.answers).length;
  const scores = ties ? scoreAnswers(session.answers as Answers) : null;
  const firstOfKind =
    QUESTIONS.findIndex((question) => question.kind === q.kind) ===
    session.index;
  const choose = (key: keyof Choices, value: string) =>
    update({ ...session, choices: { ...session.choices, [key]: value } });
  return (
    <main id="main" className="quiz-shell">
      <div className="quiz-top">
        <Link href="/" className="muted small">
          공부캐 홈
        </Link>
        <span>
          <Icon name="shield-check-linear" size={16} />
          답변 원문은 서버에 저장하지 않아요
        </span>
      </div>
      {session.index === 0 && !ties && (
        <aside className="test-purpose quiz-purpose">
          <Icon name="stars-linear" size={20} />
          <p>
            <strong>재미로 고르고, 다양한 공부법을 발견해요.</strong>
            <br />
            성격·능력을 진단하는 검사가 아니에요. 결과가 나의 공부 방식을 정하지
            않으니, 가볍게 즐겨주세요.
          </p>
        </aside>
      )}
      {session.index === 0 && !ties && (
        <aside className="quiz-collection-notice">
          <strong>
            {session.isRetake || collection.firstType
              ? "다시 알아보는 나의 공부 취향"
              : "시작 전에, 캐릭터 도감 안내"}
          </strong>
          <p>
            첫 검사에서는 로그인 없이 나만의 캐릭터를 만나요. 도감에 저장하고
            친구를 모으려면 카카오 로그인이 필요해요.
          </p>
          <p>
            재검사는 캐릭터를 실루엣으로 가리고 유형과 설명만 보여줘요. 새
            캐릭터는 추가되지 않아요.
          </p>
        </aside>
      )}
      <div className="progress-heading">
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
            <div className="question-meta">
              <span className="question-number">
                질문 {String(session.index + 1).padStart(2, "0")}
              </span>
              <span className="question-kind">
                {q.kind === "situation" ? "상황 고르기" : "두 문장 비교"}
              </span>
            </div>
            {firstOfKind && (
              <p className="question-guide">{QUESTION_GUIDES[q.kind]}</p>
            )}
            <h1 ref={heading} tabIndex={-1}>
              {q.text}
            </h1>
            <p className="question-hint">{q.hint}</p>
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
                      onChange={() => answer(q.id, option.modality, Date.now())}
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
            <div className="quiz-controls">
              <button
                className="button ghost"
                disabled={session.index === 0}
                onClick={() => {
                  setError("");
                  setDirection("previous");
                  update({
                    ...session,
                    index: session.index - 1,
                    updatedAt: Date.now(),
                  });
                }}
              >
                <Icon name="arrow-left-linear" size={18} />
                이전
              </button>
              <button
                className="button primary"
                onClick={() => {
                  if (!session.answers[q.id]) {
                    setError("답을 하나 골라주세요.");
                    return;
                  }
                  if (session.index === LAST) finish(session);
                  else {
                    setDirection("next");
                    const s = {
                      ...session,
                      index: session.index + 1,
                      updatedAt: Date.now(),
                    };
                    update(s);
                    track(s, "question", String(s.index + 1));
                  }
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
                    finish(session);
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
