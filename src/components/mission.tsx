"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Modality, type Task, type StudyType } from "@/lib/content";
import { TASKS, ROUTINES, methodFor } from "@/lib/methods";
import { readSession, saveSession } from "@/lib/storage";
import { track } from "@/lib/telemetry";
import { Icon } from "./icon";
export function Mission({
  modality,
  type,
}: {
  modality: Modality;
  type?: StudyType;
}) {
  const [task, setTask] = useState<Task>("concept");
  const [selected, setSelected] = useState(false);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  const [message, setMessage] = useState("");
  const method = methodFor(modality, task);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const m = readSession()?.mission;
      if (m?.modality === modality) {
        setTask(m.task);
        setSelected(true);
        setStarted(m.started);
        setFeedback(m.feedback);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [modality]);
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
    if (!s?.result) {
      setMessage(
        "이 페이지에서는 바로 시도할 수 있어요. 검사 후에는 활동 기록도 기기에 남길 수 있어요.",
      );
      return;
    }
    const next = {
      ...s,
      mission: {
        modality,
        task,
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
  function changeTask(t: Task) {
    setTask(t);
    setFeedback(undefined);
    setStarted(false);
    setSelected(false);
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
      <p className="method-strategies">
        <span>바탕 전략</span>
        {method.strategies.map((strategy) => (
          <strong key={strategy}>{strategy}</strong>
        ))}
      </p>
      <p className="muted">
        {TASKS[task].when} 써요. 완벽하게 하려 하지 말고, 한 가지 내용으로
        가볍게 시작해 보세요.
      </p>
      <div className="task-tabs" aria-label="공부 과제 선택">
        {(Object.keys(TASKS) as Task[]).map((t) => (
          <button
            key={t}
            aria-pressed={task === t}
            className={task === t ? "active" : ""}
            onClick={() => changeTask(t)}
          >
            {TASKS[t].label}
          </button>
        ))}
      </div>
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
      <div className="button-row">
        <button
          className="button primary"
          onClick={() => persist("start")}
          disabled={started}
        >
          <Icon name={started ? "check-circle-linear" : "play-linear"} />
          {started ? "시작했어요 · 끝나면 아래에 기록" : "지금 10분 해보기"}
        </button>
        <button
          className="button secondary"
          disabled={selected}
          onClick={() => persist("select")}
        >
          {selected ? "이 활동을 골랐어요" : "나중에 해볼게요"}
        </button>
      </div>
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
        이 활동의 근거와 한계
        <Icon name="arrow-right-up-linear" size={16} />
      </Link>
    </section>
  );
}
