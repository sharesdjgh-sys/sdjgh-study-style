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
  landscape = false,
  imageAlt,
}: {
  asset: CharacterMotionAsset;
  name: string;
  species: string;
  active: boolean;
  priority: boolean;
  landscape?: boolean;
  imageAlt?: string;
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
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const shouldPlay = !reduce && inView && tabVisible && active && !failed;

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
      void element.play().catch(() => setReady(false));
    } else {
      element.pause();
    }
  }, [loadVideo, shouldPlay]);

  return (
    <div
      ref={container}
      className={`character-motion${landscape ? " is-landscape" : ""}`}
    >
      <div
        className="character-motion-media"
        style={{ backgroundColor: asset.background }}
      >
        <Image
          src={asset.poster}
          alt={imageAlt ?? `${name}, ${species} 공부 캐릭터`}
          fill
          sizes={
            landscape
              ? "(max-width: 767px) 90vw, 1100px"
              : "(max-width: 767px) 90vw, (max-width: 1100px) 45vw, 370px"
          }
          preload={priority}
          unoptimized={landscape}
        />
        <video
          ref={video}
          src={loadVideo && !failed ? asset.video : undefined}
          poster={asset.poster}
          width={landscape ? 1280 : 720}
          height={720}
          preload="none"
          loop
          muted
          playsInline
          aria-hidden="true"
          className={ready && !reduce && !failed ? "is-ready" : ""}
          onPlaying={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}
