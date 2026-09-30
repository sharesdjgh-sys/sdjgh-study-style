"use client";
import { useState } from "react";
import Image from "next/image";
import { FAMILIES, type Modality } from "@/lib/content";
import { Icon } from "./icon";
export function StudyArt({
  modality = "visual",
  asset = null,
  compact = false,
}: {
  modality?: Modality;
  asset?: string | null;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const family = FAMILIES[modality];
  if (asset && !failed)
    return (
      <div className={`study-art ${compact ? "compact" : ""}`}>
        <Image
          src={asset}
          alt={`${family.label} 대표 이미지`}
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
        />
      </div>
    );
  return (
    <div
      className={`study-art art-${modality} ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      <div className="art-orbit" />
      <div className="art-star star-one">✳</div>
      <div className="art-star star-two">✧</div>
      {modality === "visual" && (
        <div className="mindmap">
          <div className="map-line line-one" />
          <div className="map-line line-two" />
          <div className="map-line line-three" />
          <span className="map-core">
            <Icon name="stars-linear" size={42} />
          </span>
          <span className="map-node node-one">생각</span>
          <span className="map-node node-two">연결</span>
          <span className="map-node node-three">발견</span>
          <span className="map-note">내 생각을 한눈에.</span>
        </div>
      )}
      {modality === "auditory" && (
        <div className="audio-art">
          <div className="audio-circle">
            <Icon name={family.icon} size={86} />
          </div>
          <div className="waveform">
            {[18, 32, 49, 28, 62, 40, 72, 38, 58, 26, 42, 20].map((h, i) => (
              <span key={i} style={{ height: h }} />
            ))}
          </div>
          <span className="map-note">내 말로 풀어보면.</span>
        </div>
      )}
      {modality === "tactile" && (
        <div className="cards-art">
          <span className="tiny-card card-back">하나</span>
          <span className="tiny-card card-middle">둘</span>
          <span className="tiny-card card-front">
            <Icon name={family.icon} size={58} />
            연결!
          </span>
          <span className="map-note">손끝에서 이어지는 생각.</span>
        </div>
      )}
      {modality === "motion" && (
        <div className="motion-art">
          <svg viewBox="0 0 280 220">
            <path
              d="M25 170 C10 55 155 205 130 95 S270 30 235 135"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="6 8"
            />
            <circle cx="25" cy="170" r="13" fill="currentColor" />
            <circle cx="235" cy="135" r="23" fill="var(--accent)" />
          </svg>
          <span className="motion-disc">
            <Icon name={family.icon} size={55} />
          </span>
          <span className="map-note">나만의 리듬을 따라서.</span>
        </div>
      )}
    </div>
  );
}
