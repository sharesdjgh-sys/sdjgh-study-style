"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CharacterMotionAsset } from "@/lib/character-motions";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

/** Pre-generated portraits; playback never calls a paid API. */
export function CharacterMotion({
  asset,
  name,
  species,
  active,
  priority,
}: {
  asset: CharacterMotionAsset;
  name: string;
  species: string;
  active: boolean;
  priority: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useSyncExternalStore(
    subscribeMotion,
    reducedMotion,
    () => true,
  );
  const tabVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => false,
  );
  const [inView, setInView] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const [explicitStart, setExplicitStart] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const allowMotion = (!reduce || explicitStart) && !paused;
  const shouldPlay = allowMotion && inView && tabVisible && active && !failed;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !reducedMotion()) setLoadVideo(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduce]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (shouldPlay && loadVideo) {
      void element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  }, [loadVideo, shouldPlay]);

  return (
    <div ref={container} className="character-motion">
      <div className="character-motion-media">
        <Image
          src={asset.poster}
          alt={`${name}, ${species} 공부 캐릭터`}
          width={720}
          height={720}
          sizes="(max-width: 767px) 90vw, (max-width: 1100px) 45vw, 370px"
          preload={priority}
        />
        <video
          ref={video}
          src={loadVideo && !failed ? asset.video : undefined}
          poster={asset.poster}
          width={720}
          height={720}
          preload="none"
          loop
          muted
          playsInline
          aria-hidden="true"
          className={
            ready && (!reduce || explicitStart) && !failed ? "is-ready" : ""
          }
          onPlaying={() => {
            setReady(true);
            setPlaying(true);
          }}
          onPause={() => setPlaying(false)}
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        />
      </div>
      {!failed && (
        <button
          type="button"
          className="character-motion-toggle"
          aria-label={`${name} 움직임 ${playing ? "멈추기" : "재생"}`}
          onClick={() => {
            if (playing) {
              video.current?.pause();
              setPaused(true);
            } else {
              setLoadVideo(true);
              setExplicitStart(true);
              setPaused(false);
              if (video.current?.getAttribute("src")) {
                void video.current.play().catch(() => setPlaying(false));
              }
            }
          }}
        >
          <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
          {playing ? "잠깐 멈춤" : "움직임 재생"}
        </button>
      )}
    </div>
  );
}
