"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StudyType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import {
  getMethod,
  methodOwner,
  lineupFor,
  type MethodId,
} from "@/lib/methods";
import { EFFECT_QUESTIONS, PRACTICE_SECONDS } from "@/lib/skill-economy";
import { useSkills, SKILL_ERRORS } from "./skill-provider";
import { Heart, SkillGate } from "./skill-ui";
import { MethodMeta } from "./method-meta";

export function Mission({
  methodId,
  tabs,
  type,
  onClose,
}: {
  methodId: MethodId;
  type?: StudyType;
  tabs?: ReactNode;
  resultRunId?: string;
  onClose?: () => void;
}) {
  return (
    <>
      {tabs}
      <SkillGate id={methodId} onCancel={onClose}>
        <OpenMission key={methodId} methodId={methodId} type={type} />
      </SkillGate>
    </>
  );
}
function OpenMission({
  methodId,
  type,
}: {
  methodId: MethodId;
  type?: StudyType;
}) {
  const skills = useSkills();
  const method = getMethod(methodId);
  const owner = methodOwner(methodId);
  const practice = skills.progress.practice;
  const mine = practice?.method === methodId ? practice : null;
  const rewarded = skills.progress.practiced.includes(methodId);
  const [seconds, setSeconds] = useState(0);
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const actionLock = useRef(false);
  useEffect(() => {
    const began = Date.now();
    const initial = Number(mine?.elapsed ?? 0);
    const tick = () =>
      setSeconds(
        Math.min(
          PRACTICE_SECONDS,
          initial +
            (mine?.status === "running" ? (Date.now() - began) / 1000 : 0),
        ),
      );
    const frame = requestAnimationFrame(tick);
    const timer = setInterval(tick, 250);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, [mine]);
  async function action(action: string, id = mine?.id) {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await skills.act({
        action,
        method: methodId,
        id,
        ...(action === "complete" ? { answers } : {}),
      });
      if (action === "complete") {
        setCompleted(true);
        setMessage(
          result.awarded
            ? "첫 실천 완료! 하트 1개를 받았어요."
            : "오늘의 실천을 기록했어요. 이 스킬의 첫 실천 하트는 이미 받았어요.",
        );
      }
      if (action === "start") {
        setCompleted(false);
        setAnswers([-1, -1, -1]);
      }
    } catch (e) {
      setMessage(
        SKILL_ERRORS[(e as Error).message] ??
          "연결을 확인하고 다시 시도해 주세요.",
      );
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  const left = Math.max(0, Math.ceil(PRACTICE_SECONDS - seconds));
  const done = !!mine && left === 0;
  const questions = [
    EFFECT_QUESTIONS[methodId],
    "직접 써 보니, 나에게 얼마나 도움이 됐나요?",
    "다음 공부에도 이 스킬을 써 보고 싶나요?",
  ];
  const choices = [
    [
      "확실히 그랬어요",
      "조금 그랬어요",
      "아직 잘 모르겠어요",
      "이번에는 아니었어요",
    ],
    [
      "많이 도움 됐어요",
      "조금 도움 됐어요",
      "아직 모르겠어요",
      "도움이 되지 않았어요",
    ],
    [
      "또 쓰고 싶어요",
      "상황에 맞으면 쓸래요",
      "조금 더 해볼래요",
      "다른 방법을 찾아볼래요",
    ],
  ];
  return (
    <section className="mission-panel skill-mission">
      <div className="skill-art-frame">
        <Image
          src={"/skills/" + methodId + ".webp"}
          alt={
            (owner.kind === "signature"
              ? CHARACTERS[owner.code].name + "의 "
              : "") +
            method.name +
            " 사용 장면"
          }
          width={960}
          height={640}
          sizes="(max-width: 767px) 100vw, 800px"
          className="skill-scene"
        />
        <span className="skill-art-badge">
          {owner.kind === "signature"
            ? CHARACTERS[owner.code].name + "의 시그니처"
            : "나의 공부 스킬"}
        </span>
      </div>
      <div className="skill-detail-copy">
        <span className="eyebrow">나만의 공부 공략집</span>
        <h2>{method.name}</h2>
        <p className="mission-lead">{method.oneLine}</p>
        <MethodMeta method={method} />
        <h3>이렇게 써 봐요</h3>
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
            <strong>혼자 해도 괜찮아요</strong>
            <p>{method.alone}</p>
          </div>
        )}
        {method.tip && (
          <div className="level-tip">
            <strong>{method.tip.name}</strong>
            <p>{method.tip.text}</p>
          </div>
        )}
        {type &&
          lineupFor(type).tips.map((tip) => (
            <div className="level-tip" key={tip.title}>
              <strong>{tip.title}</strong>
              <p>{tip.text}</p>
            </div>
          ))}
        <div className="skill-practice" aria-busy={busy}>
          <div className="skill-practice-head">
            <div>
              <span className="eyebrow">10 MINUTE QUEST</span>
              <h3>읽었다면, 이제 내 스킬로!</h3>
            </div>
            <span className="practice-prize">
              <Heart />
              {rewarded ? "첫 보상 받음" : "+1"}
            </span>
          </div>
          <p>
            한 가지 내용으로 10분 실천하고, 어땠는지 세 질문에 답해 주세요.
            스킬마다 처음 한 번 하트를 받아요.
          </p>
          {practice && !mine ? (
            <div className="notice">
              <p>
                <strong>{getMethod(practice.method).name}</strong> 실천이 진행
                중이에요.
              </p>
              <Link
                className="button secondary"
                href={"/methods/" + practice.method}
              >
                이어서 하기
              </Link>
              <button
                className="button ghost"
                disabled={busy}
                onClick={() => void action("cancel", practice.id)}
              >
                이전 실천 중단
              </button>
            </div>
          ) : mine ? (
            <>
              <div
                className="mission-timer"
                data-state={done ? "done" : mine.status}
              >
                <p
                  className="mission-timer-clock"
                  role="timer"
                  aria-label="남은 시간"
                >
                  {String(Math.floor(left / 60)).padStart(2, "0")}:
                  {String(left % 60).padStart(2, "0")}
                </p>
                <p role="status">
                  {done
                    ? "10분 끝! 내 경험을 남겨 볼까요?"
                    : mine.status === "paused"
                      ? "잠시 멈췄어요"
                      : "화면을 꺼도 실천 시간은 이어져요."}
                </p>
                <progress
                  value={seconds}
                  max={PRACTICE_SECONDS}
                  aria-label="실천 진행률"
                />
                {!done && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      void action(
                        mine.status === "running" ? "pause" : "resume",
                      )
                    }
                  >
                    {mine.status === "running" ? "잠시 멈추기" : "이어서 하기"}
                  </button>
                )}
                <button
                  className="button ghost"
                  disabled={busy}
                  onClick={() => void action("cancel")}
                >
                  실천 중단
                </button>
              </div>
              {done && (
                <form
                  className="skill-feedback"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action("complete");
                  }}
                >
                  <h3>해 보니, 나에게 어땠나요?</h3>
                  <p>정답은 없어요. 도움이 안 됐어도 솔직하게 답하면 돼요.</p>
                  {questions.map((question, index) => (
                    <fieldset key={question}>
                      <legend>
                        <span>{index + 1}</span> {question}
                      </legend>
                      {choices[index].map((choice, value) => (
                        <label
                          key={choice}
                          data-selected={answers[index] === value}
                        >
                          <input
                            type="radio"
                            name={"effect-" + index}
                            value={value}
                            required
                            checked={answers[index] === value}
                            onChange={() =>
                              setAnswers((old) =>
                                old.map((a, i) => (i === index ? value : a)),
                              )
                            }
                          />
                          {choice}
                        </label>
                      ))}
                    </fieldset>
                  ))}
                  <button
                    className="button primary"
                    disabled={busy || answers.some((a) => a < 0)}
                  >
                    {busy
                      ? "기록하는 중…"
                      : rewarded
                        ? "실천 기록 남기기"
                        : "실천 완료하고 하트 1개 받기"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <button
              className="button primary"
              disabled={busy || skills.error}
              onClick={() => void action("start")}
            >
              {busy
                ? "준비 중…"
                : completed
                  ? "다시 10분 해보기"
                  : "지금 10분 해보기"}
            </button>
          )}
          {message && (
            <p role="status" className={completed ? "skill-success" : "notice"}>
              {completed && <Heart />}
              {message}
            </p>
          )}
        </div>
        <Link className="text-link small" href="/about#evidence">
          이 공부법의 근거와 한계 →
        </Link>
      </div>
    </section>
  );
}
