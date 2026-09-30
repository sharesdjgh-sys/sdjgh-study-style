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
}: {
  type: StudyType;
  onComplete: () => void;
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
    "16개 응답에서 공부 패턴을 읽고 있어요",
    "생각을 정리하는 방식과 16가지 유형을 비교 중",
    "집중 환경과 공부 리듬을 연결하고 있어요",
    "분석 완료! 나만의 공부 유형을 찾았어요",
  ];
  return (
    <main id="main" className="discovery-shell" data-stage={stage}>
      <span className="eyebrow">16개의 답변, 하나의 발견</span>
      <h1 ref={heading} tabIndex={-1}>
        답변 속에 숨은
        <br />내 공부 스타일 분석 중
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
                  stage === 3 && active
                    ? "discovery-revealed"
                    : "discovery-silhouette"
                }
                unoptimized
              />
              <span>
                {stage === 3 && active
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
          ? "잠시 후, 나만의 취향 카드가 펼쳐져요"
          : "공부 방식 · 집중 환경 · 공부 리듬을 살펴보고 있어요"}
      </p>
    </main>
  );
}
