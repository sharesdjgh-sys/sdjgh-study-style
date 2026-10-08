"use client";
import { useState } from "react";
import Image from "next/image";
import { GOODS } from "@/lib/goods";
import { GoodsReveal } from "./goods-reveal";
import styles from "./goods-unlock-preview.module.css";

export function GoodsUnlockPreview() {
  const [kind, setKind] = useState("daily");
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mobile, setMobile] = useState(false);
  const selected = GOODS.find((item) => item.kind === kind)!;
  const card =
    kind === "motion"
      ? { ...selected, video: "/preview/goods-motion/series/videos/lumi.mp4" }
      : selected;
  function play(nextKind = kind) {
    setKind(nextKind);
    setRun((value) => value + 1);
    setPlaying(true);
  }
  return (
    <main id="main" className={`catalog-shell ${styles.page}`}>
      <span className="eyebrow">PREVIEW · 별 차감 없음</span>
      <h1>굿즈가 열리는 순간</h1>
      <p>로그인 없이 실제 해금 연출을 반복해서 확인해 보세요.</p>
      <div className={styles.controls}>
        <button
          className="button secondary"
          aria-pressed={kind === "daily"}
          onClick={() => play("daily")}
        >
          일상 포토카드 재생
        </button>
        <button
          className="button secondary"
          aria-pressed={kind === "special"}
          onClick={() => play("special")}
        >
          특별 의상 카드 재생
        </button>
        <button
          className="button secondary"
          aria-pressed={kind === "motion"}
          onClick={() => play("motion")}
        >
          스페셜 모션 카드 재생
        </button>
        <label>
          <input
            type="checkbox"
            checked={mobile}
            onChange={(event) => setMobile(event.target.checked)}
          />
          모바일 너비로 보기
        </label>
      </div>
      <div className={`${styles.frame} ${mobile ? styles.mobile : ""}`}>
        <div className={styles.header}>
          <strong>{card.name} · COLLECTION</strong>
          <button className="button secondary" onClick={() => play()}>
            다시 재생
          </button>
        </div>
        <div className={styles.result} hidden={playing}>
          <Image
            src={`/goods/${card.id}.webp?v=${card.imageVersion}`}
            alt={card.title}
            width={240}
            height={360}
            priority
          />
          <h2>{card.title}</h2>
          <p role="status">
            {run
              ? "새로운 한 장이 열렸어요!"
              : "위 버튼을 누르면 별빛 연출이 시작돼요."}
          </p>
        </div>
        {playing && (
          <GoodsReveal
            key={run}
            card={card}
            onFinish={() => setPlaying(false)}
          />
        )}
      </div>
    </main>
  );
}
