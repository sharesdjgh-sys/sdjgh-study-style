"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { StudyType } from "@/lib/content";
import {
  ROUTINES,
  getMethod,
  missionMethod,
  type MethodId,
} from "@/lib/methods";
import { readSession, saveSession } from "@/lib/storage";
import { track } from "@/lib/telemetry";
import { Icon } from "./icon";
import { MethodMeta } from "./method-meta";
const TIMER_MS = 10 * 60 * 1000;
type Timer =
  | { state: "running"; endsAt: number }
  | { state: "paused"; left: number }
  | { state: "done" };
const pad = (n: number) => String(n).padStart(2, "0");
/** 공부법 하나를 10분 동안 해 보는 패널. 공부법을 바꿀 때는 key로 새로 그려요. */
export function Mission({
  methodId,
  type,
  tabs,
  resultRunId,
}: {
  methodId: MethodId;
  type?: StudyType;
  resultRunId?: string;
  /** 공부법을 고르는 탭(방식별 공부법 페이지의 과제 탭) */
  tabs?: ReactNode;
}) {
  const [selected, setSelected] = useState(false);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(0);
  const method = getMethod(methodId);
  useEffect(() => {
    if (timer?.state !== "running") return;
    // 백그라운드 탭에서 interval이 늦어져도 끝나는 시각 기준으로 계산해요.
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= timer.endsAt) setTimer({ state: "done" });
    }, 250);
    return () => clearInterval(id);
  }, [timer]);
  const left =
    timer?.state === "running"
      ? Math.max(0, timer.endsAt - now)
      : timer?.state === "paused"
        ? timer.left
        : 0;
  const seconds = Math.ceil(left / 1000);
  const clock = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const local = readSession();
      const m =
        !resultRunId || local?.runId === resultRunId
          ? local?.mission
          : undefined;
      if (m && missionMethod(m) === methodId) {
        setSelected(true);
        setStarted(m.started);
        setFeedback(m.feedback);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [methodId, resultRunId]);
  function persist(
    action: "select" | "start" | "feedback",
    value?: "helpful" | "mixed" | "not-yet",
  ) {
    if (action === "select") setSelected(true);
    if (action === "start") {
      setSelected(true);
      setStarted(true);
    }
    if (value) setFeedback(value);
    const s = readSession();
    if (resultRunId && s?.runId !== resultRunId) {
      setMessage(
        "이 기록의 공부법을 바로 시도할 수 있어요. 다른 검사의 활동 기록은 바꾸지 않아요.",
      );
      return;
    }
    if (!s?.result) {
      setMessage(
        "이 페이지에서는 바로 시도할 수 있어요. 검사 후에는 활동 기록도 기기에 남길 수 있어요.",
      );
      return;
    }
    const next = {
      ...s,
      mission: {
        method: methodId,
        started: action === "start" || started,
        feedback:
          value ?? (feedback as "helpful" | "mixed" | "not-yet" | undefined),
      },
    };
    if (!saveSession(next)) setMessage("활동 기록은 이 창에서만 유지돼요.");
    track(
      s,
      action === "select"
        ? "mission_select"
        : action === "start"
          ? "mission_start"
          : "feedback",
      value ?? "",
    );
  }
  function runTimer(ms: number) {
    const t = Date.now();
    setNow(t);
    setTimer({ state: "running", endsAt: t + ms });
  }
  function startTimer() {
    if (!started) persist("start");
    runTimer(TIMER_MS);
  }
  function pauseTimer() {
    if (timer?.state !== "running") return;
    setTimer({ state: "paused", left: Math.max(0, timer.endsAt - Date.now()) });
  }
  return (
    <section className="mission-panel">
      <div className="mission-header">
        <span className="eyebrow">오늘의 작은 실험</span>
        <span className="time-pill">
          <Icon name="clock-circle-linear" size={16} />
          10분
        </span>
      </div>
      <h2>{method.name}</h2>
      <p className="method-aka">{method.aka.join(" · ")}</p>
      <p className="mission-lead">{method.oneLine}</p>
      <MethodMeta method={method} />
      <p className="muted">
        완벽하게 하려 하지 말고, 한 가지 내용으로 가볍게 시작해 보세요.
      </p>
      {tabs}
      <ol className="mission-steps">
        {method.steps.map((step, i) => (
          <li key={step}>
            <span>{i + 1}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
      <div className="level-tip">
        <strong>내 수준에 맞추기</strong>
        <p>{method.level}</p>
      </div>
      {method.alone && (
        <div className="level-tip">
          <strong>혼자 할 때</strong>
          <p>{method.alone}</p>
        </div>
      )}
      {method.tip && (
        <div className="level-tip">
          <strong>{method.tip.name}</strong>
          <p>{method.tip.text}</p>
        </div>
      )}
      {type && (
        <div className="personal-tip">
          <Icon name="stars-linear" />
          <div>
            {[ROUTINES.social[type.social], ROUTINES.pace[type.pace]].map(
              (routine) => (
                <p key={routine.title}>
                  <strong>{routine.title}</strong> {routine.text}
                </p>
              ),
            )}
          </div>
        </div>
      )}
      {timer ? (
        <div className="mission-timer" data-state={timer.state}>
          <p className="mission-timer-clock" role="timer">
            <span className="sr-only">남은 시간 </span>
            {clock}
          </p>
          <div className="mission-timer-copy" role="status">
            <strong>
              {timer.state === "done"
                ? "10분 끝! 잘했어요."
                : timer.state === "paused"
                  ? "잠시 멈췄어요"
                  : "타이머가 돌아가고 있어요"}
            </strong>
            <span>
              {timer.state === "done"
                ? "해 보니 어땠는지 아래에 남겨 주세요."
                : "1번부터 차근차근 해 보세요."}
            </span>
          </div>
          <div className="mission-timer-actions">
            {timer.state === "running" && (
              <button className="button secondary" onClick={pauseTimer}>
                <Icon name="pause-linear" size={18} />
                잠시 멈추기
              </button>
            )}
            {timer.state === "paused" && (
              <button
                className="button primary"
                onClick={() => runTimer(timer.left)}
              >
                <Icon name="play-linear" size={18} />
                이어서 하기
              </button>
            )}
            {timer.state === "done" && (
              <button
                className="button secondary"
                onClick={() => runTimer(TIMER_MS)}
              >
                <Icon name="restart-linear" size={18} />
                10분 더 하기
              </button>
            )}
            <button className="button ghost" onClick={() => setTimer(null)}>
              {timer.state === "done" ? "타이머 닫기" : "그만하기"}
            </button>
          </div>
          <div className="mission-timer-bar" aria-hidden="true">
            <span style={{ width: `${(1 - left / TIMER_MS) * 100}%` }} />
          </div>
        </div>
      ) : (
        <div className="button-row">
          <button className="button primary" onClick={startTimer}>
            <Icon name="play-linear" />
            {started ? "다시 10분 해보기" : "지금 10분 해보기"}
          </button>
          <button
            className="button secondary"
            disabled={selected}
            onClick={() => persist("select")}
          >
            {selected ? "이 공부법을 골랐어요" : "나중에 해볼게요"}
          </button>
        </div>
      )}
      <div className="feedback-block">
        <h3>직접 해보니 어땠나요?</h3>
        <p className="small muted">
          시작 버튼과 별개로, 실제로 해봤는지 알려주세요.
        </p>
        <div className="feedback-options">
          {[
            ["helpful", "해봤어요 · 도움 됐어요"],
            ["mixed", "해봤어요 · 조금 어려웠어요"],
            ["not-yet", "아직 안 해봤어요"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={feedback === value}
              className={feedback === value ? "selected" : ""}
              onClick={() =>
                persist("feedback", value as "helpful" | "mixed" | "not-yet")
              }
            >
              {label}
            </button>
          ))}
        </div>
        {feedback && (
          <p role="status" className="feedback-thanks">
            {feedback === "not-yet"
              ? "괜찮아요. 시간이 날 때 작은 내용 하나로 시작해 보세요."
              : feedback === "mixed"
                ? "어려웠던 부분을 줄여 다시 해보거나, 다른 공부법을 골라도 좋아요."
                : "좋아요. 내일 같은 내용을 짧게 떠올려 보세요."}
          </p>
        )}
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <Link className="text-link small" href="/about#evidence">
        이 공부법의 근거와 한계
        <Icon name="arrow-right-up-linear" size={16} />
      </Link>
    </section>
  );
}
