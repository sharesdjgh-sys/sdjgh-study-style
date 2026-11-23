"use client";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import { GoodsCardBack } from "@/components/goods-card-back";
import type { GoodsCard } from "@/lib/goods";
import goodsStyles from "@/components/goods-gallery.module.css";
import styles from "./page.module.css";

export function CrestSample({
  card,
  number,
  initiallyBack,
  image,
  name,
  title,
  type,
  hint,
}: {
  card: GoodsCard;
  number: number;
  initiallyBack: boolean;
  image: StaticImageData;
  name: string;
  title: string;
  type: string;
  hint: string;
}) {
  const [back, setBack] = useState(initiallyBack);
  return (
    <article>
      {back ? (
        <div className={styles.sampleReverse}>
          <div className={`${goodsStyles.card} ${card.kind === "daily" ? "" : goodsStyles.special}`}>
            <GoodsCardBack card={card} number={number} sample />
          </div>
        </div>
      ) : (
        <a href={image.src} aria-label={title + " 원본 크게 보기"}>
          <Image
            src={image}
            sizes="(max-width: 700px) 44vw, 430px"
            alt={name + " · " + title}
          />
        </a>
      )}
      <p>
        {type} · {name}
      </p>
      <h3>{title}</h3>
      <button type="button" aria-pressed={back} onClick={() => setBack(!back)}>
        {back ? "앞면 보기" : "뒷면 보기"}
      </button>
      <details>
        <summary>교표 위치 힌트</summary>
        <p>{hint}</p>
      </details>
    </article>
  );
}
