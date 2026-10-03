"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { STUDY_TYPES, type StudyType } from "@/lib/content";
import Image from "next/image";
import { MysteryCard } from "./mystery-card";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** Every round contains all 16 friends, with no repeat at the round boundary. */
function shuffledRound(previous?: StudyType) {
  const round = [...STUDY_TYPES];
  for (let i = round.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [round[i], round[j]] = [round[j], round[i]];
  }
  if (round[0] === previous) {
    const j = 1 + Math.floor(Math.random() * (round.length - 1));
    [round[0], round[j]] = [round[j], round[0]];
  }
  return round;
}

export function MysteryCarousel({
  silhouetteOnly = false,
}: {
  silhouetteOnly?: boolean;
}) {
  const remaining = useRef<StudyType[]>([]);
  const current = useRef<StudyType | undefined>(undefined);
  const [type, setType] = useState<StudyType | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const reduce = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const isPaused = paused ?? reduce;
  const next = useCallback(() => {
    if (!remaining.current.length) {
      remaining.current = shuffledRound(current.current);
    }
    current.current = remaining.current.shift()!;
    setType(current.current);
  }, []);

  // Randomize only in the browser so server and hydration markup match.
  useEffect(() => {
    const timer = window.setTimeout(next, 0);
    return () => window.clearTimeout(timer);
  }, [next]);

  useEffect(() => {
    if (isPaused || !type) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") next();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isPaused, next, type]);

  if (silhouetteOnly) {
    return (
      <div className="silhouette-preview" data-ready={!!type}>
        <div className="silhouette-stage" aria-hidden="true">
          <span className="silhouette-glow" />
          <Image
            key={type?.code}
            src={(type ?? STUDY_TYPES[0]).asset!}
            alt=""
            width={360}
            height={360}
            sizes="(max-width: 767px) 220px, 300px"
            draggable={false}
          />
          <span className="silhouette-question">?</span>
        </div>
        <p className="silhouette-caption">이 실루엣, 너랑 닮았을지도?</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="hero-character-card mystery-carousel"
        data-ready={!!type}
        data-paused={isPaused}
      >
        <MysteryCard key={type?.code} type={type ?? STUDY_TYPES[0]} priority />
        <div className="mystery-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
          <span>✧</span>
        </div>
      </div>
      <div className="deck-selector" role="group" aria-label="실루엣 미리보기">
        <button type="button" onClick={() => setPaused(!isPaused)}>
          {isPaused ? "자동 넘김 시작" : "잠시 멈추기"}
        </button>
        <button type="button" onClick={next}>
          다음 실루엣 보기 <span aria-hidden="true">→</span>
        </button>
      </div>
    </>
  );
}
