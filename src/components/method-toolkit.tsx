"use client";
import { useEffect, useRef, useState } from "react";
import type { StudyType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import {
  TASKS,
  getMethod,
  lineupFor,
  missionMethod,
  type MethodId,
} from "@/lib/methods";
import { readSession } from "@/lib/storage";
import { Mission } from "./mission";
import { BasicsNote, MethodMeta } from "./method-meta";

/** 받침이 있으면 "이", 없으면 "가" */
const subject = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return `${word}${code >= 0 && code <= 11171 && code % 28 ? "이" : "가"}`;
};

/** 공부캐 한 명이 즐겨 쓰는 공부법 4개와 공부 팁 2개, 고른 공부법의 10분 실험 */
export function MethodToolkit({
  type,
  hideCharacter = false,
}: {
  type: StudyType;
  hideCharacter?: boolean;
}) {
  const lineup = lineupFor(type);
  const cards: { id: MethodId; kind: string; signature?: boolean }[] = [
    { id: lineup.signature, kind: "시그니처", signature: true },
    ...lineup.byTask.map(({ task, method }) => ({
      id: method,
      kind: TASKS[task].label,
    })),
  ];
  const [selected, setSelected] = useState<MethodId>(lineup.signature);
  const mission = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      // 지난번에 고른 공부법이 이 공부캐의 공부법이면 그대로 이어서 보여 줘요.
      const m = readSession()?.mission;
      const saved = m && missionMethod(m);
      const { signature, byTask } = lineupFor(type);
      if (
        saved &&
        (saved === signature || byTask.some((b) => b.method === saved))
      )
        setSelected(saved);
    });
    return () => cancelAnimationFrame(id);
  }, [type]);
  function choose(id: MethodId) {
    setSelected(id);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    requestAnimationFrame(() =>
      mission.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      }),
    );
  }
  const owner = hideCharacter ? "이 유형" : CHARACTERS[type.code].name;
  return (
    <>
      <section
        className="method-toolkit"
        id="study-methods"
        data-family={type.modality}
        aria-labelledby="study-methods-title"
      >
        <div className="toolkit-head">
          <span className="eyebrow">
            이름 있는 공부법 4가지 + 공부 팁 2가지
          </span>
          <h2 id="study-methods-title">{owner}의 공부법 도구함</h2>
          <p>
            {subject(owner)} 즐겨 쓰는 공부법이에요. 하나를 골라 아래에서 10분만
            해 봐요. 다른 공부캐의 공부법도 누구나 쓸 수 있어요.
          </p>
        </div>
        <div className="toolkit-grid">
          {cards.map(({ id, kind, signature }) => {
            const method = getMethod(id);
            return (
              <button
                key={id}
                type="button"
                className={`toolkit-card${signature ? " is-signature" : ""}`}
                aria-pressed={selected === id}
                onClick={() => choose(id)}
              >
                <span className="toolkit-kind">
                  {signature && <span aria-hidden="true">★ </span>}
                  {kind}
                </span>
                <span className="toolkit-name">{method.name}</span>
                <span className="toolkit-line">{method.oneLine}</span>
                <MethodMeta method={method} />
                <span className="toolkit-go">
                  {selected === id ? "아래에서 해 보는 중" : "이 공부법 해보기"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="toolkit-tips">
          <strong>함께 쓰는 공부 팁</strong>
          {lineup.tips.map((tip) => tip.title).join(" · ")}
          <span> — 아래 10분 실험 안에 있어요.</span>
        </p>
        <BasicsNote />
      </section>
      <div className="toolkit-mission" ref={mission}>
        <Mission key={selected} methodId={selected} type={type} />
      </div>
    </>
  );
}
