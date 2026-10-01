"use client";
import { useEffect, useRef, useState } from "react";
import {
  FAMILIES,
  STUDY_TYPES,
  SOCIAL_LABELS,
  PACE_LABELS,
  type StudyType,
} from "@/lib/content";
import Image from "next/image";
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
  const complete = useRef(onComplete);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    heading.current?.focus();
    const timers = [900, 1900, 2900].map((delay, index) =>
      setTimeout(() => setStage(index + 1), delay),
    );
    timers.push(setTimeout(() => complete.current(), 4400));
    return () => timers.forEach(clearTimeout);
  }, []);
  const messages = [
    "16개의 답변에서 취향 조각을 모으고 있어요",
    "그림으로, 말로, 손으로, 움직이며! 어떤 방식이 끌렸나요?",
    "혼자 또는 함께, 계획대로 또는 자유롭게!",
    revealCharacter
      ? "발견 완료! 나를 닮은 공부캐를 만났어요"
      : "발견 완료! 지금의 공부 취향을 살펴봐요",
  ];
  return (
    <main id="main" className="discovery-shell" data-stage={stage}>
      <span className="eyebrow">16개의 답변, 하나의 발견</span>
      <h1 ref={heading} tabIndex={-1}>
        취향 조각을 모아,
        <br />
        {revealCharacter ? "나의 공부캐 찾는 중" : "지금의 공부 스타일 찾는 중"}
      </h1>
      <p className="discovery-status" role="status" aria-live="polite">
        {messages[stage]}
      </p>
      <div className="discovery-grid" aria-hidden="true">
        {STUDY_TYPES.map((candidate, index) => {
          const active =
            (stage < 1 || candidate.modality === type.modality) &&
            (stage < 2 || candidate.social === type.social) &&
            (stage < 3 || candidate.pace === type.pace);
          return (
            <div
              key={candidate.code}
              className={`discovery-tile ${active ? "is-candidate" : "is-dismissed"} ${stage === 3 && active ? "is-match" : ""}`}
            >
              <span className="discovery-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Image
                src={characterThumbnail(candidate.code)}
                alt=""
                width={80}
                height={80}
                className={
                  stage === 3 && active && revealCharacter
                    ? "discovery-revealed"
                    : "discovery-silhouette"
                }
                unoptimized
              />
              <span>
                {stage === 3 && active && revealCharacter
                  ? CHARACTERS[candidate.code].name
                  : "???"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="discovery-clues" aria-label="발견한 공부 취향">
        {[
          FAMILIES[type.modality].label,
          SOCIAL_LABELS[type.social],
          PACE_LABELS[type.pace],
        ].map((clue, index) => (
          <span key={clue} className={stage > index ? "is-found" : ""}>
            {stage > index ? clue : "아직 펼치지 않은 취향"}
          </span>
        ))}
      </div>
      <div className="discovery-progress" aria-hidden="true">
        <span />
      </div>
      <p className="discovery-note">
        {stage === 3
          ? revealCharacter
            ? "잠시 후, 나만의 취향 카드가 펼쳐져요"
            : "잠시 후, 지금의 유형과 공부법 설명을 보여드릴게요"
          : "공부 방식 · 집중 환경 · 공부 리듬을 살펴보고 있어요"}
      </p>
    </main>
  );
}
