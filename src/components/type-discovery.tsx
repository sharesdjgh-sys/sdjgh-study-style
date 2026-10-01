"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { QUESTIONS, STUDY_TYPES, type StudyType } from "@/lib/content";
import { CHARACTERS, characterThumbnail } from "@/lib/characters";

export function TypeDiscovery({
  type,
  onComplete,
  revealCharacter = true,
}: {
  type: StudyType;
  onComplete: () => void;
  revealCharacter?: boolean;
}) {
  const [stage, setStage] = useState(0);
  const [current, setCurrent] = useState(0);
  const complete = useRef(onComplete);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    heading.current?.focus();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let timer: ReturnType<typeof setTimeout>;
    let tick = 0;
    let previous = 0;
    // Only the silhouettes are random; the final character always comes from the result.
    function shuffle() {
      previous =
        (previous + 1 + Math.floor(Math.random() * (STUDY_TYPES.length - 1))) %
        STUDY_TYPES.length;
      setCurrent(previous);
      tick++;
      timer = setTimeout(shuffle, tick < 23 ? 85 : tick < 29 ? 150 : 280);
    }
    if (!reduced) timer = setTimeout(shuffle, 85);
    const pause = setTimeout(() => {
      clearTimeout(timer);
      setStage(2);
    }, 3300);
    const reveal = setTimeout(() => setStage(3), 3800);
    const finish = setTimeout(() => complete.current(), 6000);
    return () => {
      clearTimeout(timer);
      clearTimeout(pause);
      clearTimeout(reveal);
      clearTimeout(finish);
    };
  }, []);
  const revealed = stage === 3;
  return (
    <main
      id="main"
      className="discovery-shell discovery-roulette"
      data-stage={stage}
    >
      <span className="eyebrow">{QUESTIONS.length}개의 답변, 하나의 발견</span>
      <h1 ref={heading} tabIndex={-1}>
        {revealed
          ? revealCharacter
            ? "짠! 나의 공부캐 등장"
            : "나의 공부 스타일 발견!"
          : stage === 2
            ? "바로… 이 친구!"
            : "어떤 공부캐가 나타날까?"}
      </h1>
      <p className="discovery-status" role="status" aria-live="polite">
        {revealed
          ? revealCharacter
            ? `반가워, ${CHARACTERS[type.code].name}!`
            : "지금의 공부 취향을 찾았어요"
          : "두근두근, 나를 닮은 친구를 만나고 있어요"}
      </p>
      <div className="discovery-reel" aria-hidden="true">
        <div className="discovery-aura" />
        <span className="discovery-orbit orbit-one">✦</span>
        <span className="discovery-orbit orbit-two">✧</span>
        <span className="discovery-orbit orbit-three">✦</span>
        {STUDY_TYPES.map((candidate, index) => {
          const active = revealed
            ? candidate.code === type.code
            : index === current;
          return (
            <div
              key={candidate.code}
              className={`discovery-frame ${active ? "is-current" : ""} ${revealed && active ? "is-match" : ""}`}
            >
              <Image
                src={characterThumbnail(candidate.code)}
                alt=""
                fill
                sizes="320px"
                loading="eager"
                unoptimized
                className={
                  revealed && active && revealCharacter
                    ? "discovery-revealed"
                    : "discovery-silhouette"
                }
              />
            </div>
          );
        })}
        <span className="discovery-reel-label">
          {revealed
            ? revealCharacter
              ? CHARACTERS[type.code].name
              : "발견 완료"
            : "???"}
        </span>
      </div>
      <div className="discovery-progress" aria-hidden="true">
        <span />
      </div>
      <p className="discovery-note">
        {revealed
          ? "잠시 후, 나만의 취향 카드가 펼쳐져요"
          : stage === 2
            ? "준비됐나요?"
            : "나와 닮은 공부 스타일을 찾는 중"}
      </p>
    </main>
  );
}
