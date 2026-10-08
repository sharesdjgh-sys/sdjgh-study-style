"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { goodsPrice, goodsKindLabel, type GoodsCard } from "@/lib/goods";
import { Star } from "./star-wallet";
import styles from "./goods-reveal.module.css";

export function GoodsReveal({
  card,
  onFinish,
}: {
  card: GoodsCard;
  onFinish: () => void;
}) {
  const special = card.kind !== "daily";
  const motion = card.kind === "motion";
  const finish = useRef(onFinish);
  const skip = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState("gather");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    finish.current = onFinish;
  }, [onFinish]);
  useEffect(() => {
    skip.current?.focus();
    // A slow image must never trap a successfully purchased card.
    const fallback = window.setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(fallback);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      const quick = window.setTimeout(() => finish.current(), 350);
      return () => clearTimeout(quick);
    }
    const opening = window.setTimeout(() => setPhase("opening"), 1500);
    const revealed = window.setTimeout(() => setPhase("revealed"), 2600);
    const done = window.setTimeout(() => finish.current(), 5200);
    const changed = () => {
      if (reduced.matches) finish.current();
    };
    reduced.addEventListener("change", changed);
    return () => {
      [opening, revealed, done].forEach(clearTimeout);
      reduced.removeEventListener("change", changed);
    };
  }, [ready]);
  const revealed = phase === "revealed";
  return (
    <section
      className={`${styles.reveal} ${special ? styles.special : ""} ${motion ? styles.motion : ""}`}
      data-running={ready}
      data-phase={phase}
      aria-label="굿즈 해금 연출"
    >
      <div className={styles.ambience} aria-hidden="true" />
      <div className={styles.topline}>
        <span>{goodsKindLabel(card)}</span>
        <button ref={skip} className={styles.skip} onClick={onFinish}>
          연출 건너뛰기
        </button>
      </div>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.rays} />
        <div className={styles.orbit} />
        <div className={styles.orbitInner} />
        {Array.from({ length: 16 }, (_, index) => (
          <i
            key={index}
            className={styles.dust}
            style={
              {
                "--angle": `${index * 22.5}deg`,
                "--delay": `${(index % 4) * 90}ms`,
                "--distance": `${155 + (index % 3) * 18}px`,
              } as CSSProperties
            }
          />
        ))}
        {Array.from({ length: goodsPrice(card) }, (_, index) => index).map(
          (index) => (
            <span
              key={index}
              className={styles.offering}
              style={
                {
                  "--direction": motion ? index - 1 : index ? 1 : -1,
                  "--delay": `${index * 240}ms`,
                } as CSSProperties
              }
            >
              <Star size={48} />
            </span>
          ),
        )}
        <div className={styles.cardFloat}>
          <div className={styles.card}>
            <div className={styles.cover}>
              <div className={styles.coverLines} />
              <span className={styles.coverTop}>STUDYCREW</span>
              <div className={styles.medallion}>
                <Star size={66} />
              </div>
              <span className={styles.coverBottom}>
                {motion
                  ? "SPECIAL MOTION"
                  : special
                    ? "SPECIAL COSTUME"
                    : "DAILY MOMENT"}
                <small>아직 만나지 못한 순간</small>
              </span>
            </div>
            <div className={styles.front}>
              <Image
                src={`/goods/${card.id}.webp?v=${card.imageVersion}`}
                alt=""
                width={384}
                height={576}
                loading="eager"
                onLoad={() => setReady(true)}
                onError={() => finish.current()}
              />
              {motion && revealed && (
                <video
                  src={card.video}
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload="auto"
                  aria-hidden="true"
                />
              )}
              <span className={styles.sheen} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.caption} role="status" aria-live="polite">
        <span className={styles.kicker}>
          {revealed ? "MY NEW COLLECTION" : "별에 담아 둔 설렘을 꺼내요"}
        </span>
        <h3>
          {revealed
            ? card.title
            : phase === "opening"
              ? "어떤 순간을 만나게 될까요?"
              : "별빛이 모이면, 이야기가 열려요"}
        </h3>
        <p>
          {revealed
            ? motion
              ? `${card.name}의 순간이 움직이기 시작했어요. 이제 언제든 재생할 수 있어요.`
              : `${card.name}의 새로운 순간이 내 컬렉션에 들어왔어요.`
            : "잠시 후, 나만의 한 장이 펼쳐집니다."}
        </p>
      </div>
      <div className={styles.progress} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
