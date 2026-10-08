"use client";
import { useEffect, useRef, useState } from "react";
import type { GoodsCard } from "@/lib/goods";
import styles from "./goods-gallery.module.css";

export function GoodsMotionPlayer({
  card,
  autoPlay = false,
}: {
  card: GoodsCard;
  autoPlay?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = video.current;
    if (
      autoPlay &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      void element?.play().catch(() => {});
    return () => element?.pause();
  }, [autoPlay]);
  return (
    <div className={styles.motionPlayer}>
      <video
        ref={video}
        src={card.video}
        poster={`/goods/${card.id}.webp?v=${card.imageVersion}`}
        controls
        playsInline
        muted
        loop
        preload="metadata"
        aria-label={`${card.name} 스페셜 카드 영상`}
        onError={() =>
          setError("영상을 불러오지 못했어요. 다시 재생해 주세요.")
        }
      />
      <button
        className="button star-button"
        onClick={() => {
          setError("");
          if (video.current) {
            if (video.current.error) video.current.load();
            video.current.currentTime = 0;
            void video.current
              .play()
              .catch(() => setError("재생 버튼을 다시 눌러 주세요."));
          }
        }}
      >
        처음부터 영상 재생
      </button>
      <p className="small">
        약 15초 · 반복 재생 · 소장한 영상은 별을 다시 쓰지 않아요
      </p>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
