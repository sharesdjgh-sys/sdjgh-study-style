"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ANSWER_LABELS,
  QUESTIONS,
  FAMILIES,
  SOCIAL_LABELS,
  PACE_LABELS,
  type Answers,
  getType,
} from "@/lib/content";
import { scoreAnswers, resolveType, type Choices } from "@/lib/scoring";
import {
  readSession,
  newSession,
  saveSession,
  type Session,
} from "@/lib/storage";
import { track } from "@/lib/telemetry";
import { Icon } from "./icon";
import { Arrow } from "./shell";
import { useConfirm } from "./ui/confirm-dialog";
import { TypeDiscovery } from "./type-discovery";
export function Quiz() {
  const router = useRouter();
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
    };
    update(completed);
    track(completed, "complete");
    setDiscovering(true);
  }
  async function restart() {
    if (
      await confirm({
        title: "새로 시작할까요?",
        description: "16개의 질문에 새롭게 답할 수 있어요.",
        note: "이 기기에 저장된 이전 검사와 활동 기록은 새 기록으로 바뀌어요.",
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
  if (!session)
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
  const choose = (key: keyof Choices, value: string) =>
    update({ ...session, choices: { ...session.choices, [key]: value } });
  return (
    <main id="main" className="quiz-shell">
      <div className="quiz-top">
        <Link href="/" className="muted small">
          공부결 홈
        </Link>
        <span>
          <Icon name="shield-check-linear" size={16} />
          답변은 이 기기에만 저장해요
        </span>
      </div>
      <div className="progress-heading">
        <span>
          {ties ? "마지막으로, 하나만 골라주세요" : "내 공부 취향 알아보기"}
        </span>
        <strong>
          {ties ? "16" : String(session.index + 1).padStart(2, "0")}
          <span> / 16</span>
        </strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="응답 진행률"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={16}
      >
        <span style={{ transform: `scaleX(${count / 16})` }} />
      </div>
      <p
        className="quiz-encouragement"
        key={`encourage-${Math.floor(session.index / 4)}`}
      >
        <span aria-hidden="true">✦</span>{" "}
        {ties
          ? "마지막 취향 한 조각, 직접 골라볼까요?"
          : [
              "첫 느낌대로 골라요. 정답은 없으니까!",
              "취향 조각이 모이고 있어요. 조금 더 알아볼까요?",
              "벌써 절반! 나다운 공부 모습이 보이기 시작해요.",
              "이제 마지막 네 조각. 어떤 카드가 나올까요?",
            ][Math.floor(session.index / 4)]}
      </p>
      <section
        className="question-card"
        data-direction={direction}
        key={ties ? "ties" : q.id}
      >
        {!ties ? (
          <>
            <span className="question-number">
              질문 {String(session.index + 1).padStart(2, "0")}
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {q.text}
            </h1>
            <p className="question-hint">{q.hint}</p>
            <fieldset className="answers">
              <legend className="sr-only">나에게 얼마나 해당하나요?</legend>
              {ANSWER_LABELS.map((label, i) => (
                <label
                  className={`answer-option ${session.answers[q.id] === i + 1 ? "checked" : ""}`}
                  key={label}
                >
                  <input
                    type="radio"
                    aria-label={label}
                    name={q.id}
                    value={i + 1}
                    checked={session.answers[q.id] === i + 1}
                    onChange={() => {
                      setError("");
                      update({
                        ...session,
                        answers: { ...session.answers, [q.id]: i + 1 },
                        choices: {},
                        updatedAt: Date.now(),
                      });
                    }}
                  />
                  <span className="answer-score" aria-hidden="true">
                    {i + 1}점
                  </span>
                  <span className="answer-label" aria-hidden="true">
                    {label}
                  </span>
                  <span className="answer-label-short" aria-hidden="true">
                    {
                      [
                        "전혀\n아님",
                        "아닌\n편",
                        "보통",
                        "그런\n편",
                        "매우\n그럼",
                      ][i]
                    }
                  </span>
                </label>
              ))}
            </fieldset>
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
                  if (session.index === 15) finish(session);
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
                {session.index === 15 ? "내 결과 보기" : "다음 질문"}
                <Arrow />
              </button>
            </div>
          </>
        ) : (
          scores && (
            <>
              <span className="question-number">
                여러 방식이 비슷하게 나왔어요
              </span>
              <h1 ref={heading} tabIndex={-1}>
                지금 시도해 보고 싶은
                <br />
                방식을 골라주세요.
              </h1>
              <p className="question-hint">
                추가 점수는 없어요. 선택한 방식을 대표 스타일로 보여드릴게요.
                {scores.uniform &&
                  " 모든 응답이 같아 뚜렷한 차이는 나타나지 않았어요."}
              </p>
              {scores.candidates.modality.length > 1 && (
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
              )}
              {scores.candidates.social.length > 1 && (
                <fieldset className="tie-group">
                  <legend>누구와 해볼까요?</legend>
                  {scores.candidates.social.map((s) => (
                    <label
                      className={`tie-choice ${session.choices.social === s ? "checked" : ""}`}
                      key={s}
                    >
                      <input
                        type="radio"
                        name="social"
                        checked={session.choices.social === s}
                        onChange={() => choose("social", s)}
                      />
                      {SOCIAL_LABELS[s]}
                    </label>
                  ))}
                </fieldset>
              )}
              {scores.candidates.pace.length > 1 && (
                <fieldset className="tie-group">
                  <legend>어떤 흐름이 끌리나요?</legend>
                  {scores.candidates.pace.map((p) => (
                    <label
                      className={`tie-choice ${session.choices.pace === p ? "checked" : ""}`}
                      key={p}
                    >
                      <input
                        type="radio"
                        name="pace"
                        checked={session.choices.pace === p}
                        onChange={() => choose("pace", p)}
                      />
                      {PACE_LABELS[p]}
                    </label>
                  ))}
                </fieldset>
              )}
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
                      setError("각 항목에서 하나씩 골라주세요.");
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
