"use client";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import styles from "./page.module.css";

export function CrestSample({
  image,
  name,
  title,
  type,
  hint,
}: {
  image: StaticImageData;
  name: string;
  title: string;
  type: string;
  hint: string;
}) {
  const [back, setBack] = useState(false);
  return (
    <article>
      {back ? (
        <div className={styles.sampleReverse}>
          <span>서여고 교표 카드 · 견본</span>
          <strong>{title}</strong>
          <b>당첨 번호 000번 (예시)</b>
          <small>실제 지급 시에는 소장 카드의 번호를 보여주세요.</small>
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
