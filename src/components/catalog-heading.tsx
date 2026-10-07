"use client";

import Image from "next/image";
import { CHARACTERS } from "@/lib/characters";
import { collectionProgress } from "@/lib/collection-progress";
import { useCollection } from "./collection-provider";
import { useSavedSession } from "./use-saved-session";
import { SignatureBadge } from "./skill-badges";
import styles from "./catalog-heading.module.css";

export function CatalogHeading() {
  const { data, loaded } = useCollection();
  const saved = useSavedSession();
  const ready = loaded && saved.loaded;
  const code = ready
    ? collectionProgress(data, saved.first?.result).firstCode
    : undefined;
  return (
    <div className={styles.heading}>
      <h1>
        나와 닮은 <span className="skill-spectrum">친구,</span>
        <br />
        <span className="catalog-title-highlight">누구일까요?</span>
      </h1>
      <div className={styles.badge}>
        {code ? (
          <SignatureBadge
            code={code}
            label={`${CHARACTERS[code].name} 공부캐 배지`}
            imageSizes="(max-width: 767px) 110px, 180px"
          />
        ) : (
          <span
            className="signature-badge"
            role="img"
            aria-label={
              ready
                ? "아직 발견하지 않은 나의 공부캐 배지"
                : "나의 공부캐 확인 중"
            }
          >
            <span
              className={`signature-badge-portrait ${styles.mystery}`}
              aria-hidden="true"
            >
              ?
            </span>
            <Image
              className="signature-badge-frame"
              src="/skills/signature-badge-frame.webp"
              alt=""
              width={192}
              height={192}
              sizes="(max-width: 767px) 80px, 136px"
            />
          </span>
        )}
      </div>
    </div>
  );
}
