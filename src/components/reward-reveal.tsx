"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { getType, STUDY_TYPES } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import styles from "./reward-reveal.module.css";

export function GiftBox({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`${styles.gift} ${small ? styles.small : ""}`}
      aria-hidden="true"
    >
      <Image
        className={styles.giftClosed}
        src="/ui-icons/card-pack-v1.webp"
        alt=""
        width={640}
        height={960}
        sizes={small ? "72px" : "280px"}
        loading="eager"
      />
    </span>
  );
}

export function RewardReveal({
  code,
  bonus,
  collected,
  total,
  pending,
  close,
}: {
  code: string;
  bonus: boolean;
  collected: number;
  total: number;
  pending: number;
  close: () => void;
}) {
  const [phase, setPhase] = useState<
    "wrapped" | "opening" | "rolling" | "revealed"
  >("wrapped");
  const dialog = useRef<HTMLDialogElement>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [frame, setFrame] = useState(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const revealButton = useRef<HTMLButtonElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const doneButton = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const type = getType(code)!;
  const revealed = phase === "revealed";
  useEffect(() => {
    if (phase === "rolling") skipButton.current?.focus();
    if (phase === "revealed") doneButton.current?.focus();
  }, [phase]);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    revealButton.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
      else document.getElementById("collection-heading")?.focus();
    };
  }, []);
  useEffect(() => {
    if (phase !== "opening") return;
    skipButton.current?.focus();
    const clip = video.current;
    const advance = () =>
      setPhase((current) => (current === "opening" ? "rolling" : current));
    // A blocked or stalled video must never trap an already awarded card.
    const timer = setTimeout(advance, 8000);
    if (clip) {
      clip.currentTime = 0;
      void clip.play().catch(advance);
    } else advance();
    return () => {
      clearTimeout(timer);
      clip?.pause();
    };
  }, [phase]);
  useEffect(() => {
    if (phase !== "rolling") return;
    // Fast silhouettes slow down before holding the actual awarded card.
    const delays = [80, 80, 90, 100, 110, 130, 160, 200, 260, 340, 460, 700];
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        current++;
        if (current === delays.length) setPhase("revealed");
        else {
          setFrame(current);
          next();
        }
      }, delays[current]);
    };
    next();
    return () => clearTimeout(timer);
  }, [phase]);
  function openGift() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("revealed");
      return;
    }
    const pool = STUDY_TYPES.filter((item) => item.code !== code).map(
      (item) => item.code,
    );
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // This is only the reveal animation; the server-issued reward never changes.
    setSequence([...pool.slice(0, 11), code]);
    setFrame(0);
    setPhase("opening");
  }
  const complete = collected >= total;
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-phase={phase}
      aria-labelledby="reward-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <button
        className={styles.close}
        onClick={close}
        aria-label="선물 화면 닫기"
      >
        ×
      </button>
      <p className={styles.eyebrow}>
        {bonus
          ? "WELCOME GIFT · 친구 초대 보너스"
          : "FRIENDSHIP GIFT · 초대 성공 선물"}
      </p>
      <h2 id="reward-title" aria-live="polite">
        {revealed
          ? `${CHARACTERS[code].name}, 도감에 합류!`
          : phase === "rolling"
            ? "누가 찾아올까요?"
            : "친구 덕분에, 선물 도착!"}
      </h2>
      <p className={styles.subtitle}>
        {revealed
          ? "아직 만나지 못했던 공부 친구를 발견했어요."
          : phase === "rolling"
            ? "두근두근… 곧 만나요!"
            : bonus
              ? "내 첫 공부캐에 보너스 카드 한 장 더!"
              : "초대한 친구가 첫 결과를 도감에 저장했어요."}
      </p>
      {!revealed && (
        <div
          className={styles.reel}
          hidden={phase !== "rolling"}
          aria-hidden="true"
          data-frame={frame}
        >
          <span className={styles.reelLabel}>
            {frame >= 9 ? "이제 곧…!" : "어떤 공부 친구일까?"}
          </span>
          <div className={styles.reelPortrait}>
            {STUDY_TYPES.map((candidate) => (
              <Image
                key={candidate.code}
                src={candidate.asset!}
                alt=""
                width={240}
                height={240}
                sizes="220px"
                loading="eager"
                className={
                  sequence[frame] === candidate.code
                    ? styles.reelCurrent
                    : styles.reelHidden
                }
                onLoad={
                  candidate.code === code
                    ? () => setImageReady(true)
                    : undefined
                }
              />
            ))}
            <span className={styles.question}>?</span>
          </div>
          <strong>???</strong>
          <span className={styles.reelDots}>✦ · ✦ · ✦</span>
        </div>
      )}
      {phase === "rolling" && (
        <button
          ref={skipButton}
          className={styles.skip}
          onClick={() => setPhase("revealed")}
        >
          바로 공개하기
        </button>
      )}
      {revealed ? (
        <>
          <div className={styles.reveal}>
            <div className={styles.confetti} aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <i
                  key={i}
                  style={
                    {
                      "--i": i,
                      "--x": `${(i * 37) % 100}%`,
                      "--turn": `${i * 43}deg`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <span className={styles.newBadge}>NEW FRIEND · 카드 +1</span>
            <div className={styles.card} data-family={type.modality}>
              <span className={styles.cardNumber}>
                STUDYCREW · No. {CHARACTERS[code].number}
              </span>
              <div className={styles.portrait}>
                <Image
                  src={type.asset!}
                  alt={`${CHARACTERS[code].name}, 새로 얻은 공부캐`}
                  width={240}
                  height={240}
                  sizes="220px"
                  priority
                  onLoad={() => setImageReady(true)}
                  onError={() => setImageError(true)}
                  style={{ opacity: imageReady ? 1 : 0 }}
                />
                {!imageReady && (
                  <span role="status">
                    {imageError
                      ? "캐릭터 그림은 도감에서 다시 볼 수 있어요."
                      : "캐릭터 그림을 불러오는 중…"}
                  </span>
                )}
              </div>
              <h3>{CHARACTERS[code].name}</h3>
              <p>{type.name}</p>
            </div>
          </div>
          <section
            className={styles.progress}
            aria-label="선물 개봉 후 도감 진행도"
          >
            <div>
              <strong>
                {complete
                  ? "열여섯 친구, 모두 모았다!"
                  : "도감이 한 칸 더 채워졌어요"}
              </strong>
              <span>
                {collected} / {total}
              </span>
            </div>
            <progress max={total} value={collected} aria-label="모은 공부캐" />
            <p>
              {complete
                ? "도감 완성! 스페셜 단체사진도 확인해 보세요."
                : pending > 0
                  ? `다음 선물도 도착해 있어요! ${pending}개가 더 기다려요.`
                  : "다음엔 누가 올까요? 새 친구를 초대해 다음 카드를 만나봐요."}
            </p>
          </section>
          <button
            ref={doneButton}
            className={`button primary ${styles.done}`}
            onClick={close}
          >
            도감에서 만나기
          </button>
          {pending > 0 && (
            <p className={styles.hint}>
              도감의 선물함에서 다음 선물을 열 수 있어요.
            </p>
          )}
        </>
      ) : phase === "opening" ? (
        <div className={styles.cinema}>
          <video
            ref={video}
            src="/rewards/card-pack-opening-v1.mp4"
            poster="/rewards/card-pack-poster-v1.webp"
            width={720}
            height={960}
            muted
            playsInline
            preload="auto"
            aria-label="카드팩이 열리고 카드 뒷면이 올라오는 개봉 영상"
            onEnded={() =>
              setPhase((current) =>
                current === "opening" ? "rolling" : current,
              )
            }
            onError={() =>
              setPhase((current) =>
                current === "opening" ? "rolling" : current,
              )
            }
          />
          <p className={styles.hint}>봉투 속 공부 친구를 꺼내는 중…</p>
          <button
            ref={skipButton}
            className={styles.skip}
            onClick={() => setPhase("revealed")}
          >
            바로 공개하기
          </button>
        </div>
      ) : phase !== "rolling" ? (
        <>
          <button
            ref={revealButton}
            className={styles.open}
            aria-label="선물 포장 열기"
            onClick={openGift}
          >
            <span className={styles.halo} />
            <GiftBox />
            <span className={styles.tap}>눌러서 카드팩 뜯기</span>
          </button>
          <p className={styles.guarantee}>
            아직 없는 카드 <strong>1장 확정</strong> · 중복 없이 만나요
          </p>
          <p className={styles.hint}>
            카드는 이미 도감에 보관됐어요. 닫아도 사라지지 않아요.
          </p>
        </>
      ) : null}
    </dialog>
  );
}
