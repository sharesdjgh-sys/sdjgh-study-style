"use client";
import { useState } from "react";
import { FAMILIES, type Modality } from "@/lib/content";
import { specialCardProgress } from "@/lib/special-card";
import { useCollection } from "./collection-provider";
import { GroupPhotoSilhouette } from "./group-photo-silhouette";
import {
  SpecialPhoto,
  SpecialPhotoDialog,
  photoUrl,
  type CollectionPhoto,
} from "./special-collection-card";

export function FamilyCollectionCard({ modality }: { modality: Modality }) {
  const { data, loaded, error } = useCollection();
  const [expanded, setExpanded] = useState(false);
  const { collected, total, unlocked } = specialCardProgress(data, modality);
  const label = FAMILIES[modality].label;
  const photo: CollectionPhoto = {
    url: `/api/collection/special-card?family=${modality}`,
    alt: `${label} 공부캐 네 명이 함께 찍은 기념 단체사진`,
    title: `${label} 친구들, 다 모였다!`,
    caption: "네 친구의 공부 취향을 모아, 한 장의 추억으로.",
    filename: `공부캐-${label}-단체사진.png`,
    videoUrl: `/api/collection/special-card?family=${modality}&format=mp4`,
  };
  if (!loaded || error) return null;
  return (
    <section
      className={`family-collection-card ${unlocked ? "is-unlocked" : "is-locked"}`}
      aria-label={`${label} 완성 단체사진`}
      data-family={modality}
    >
      <div className="special-card-copy">
        <span className="eyebrow">{label} 완성 선물 · 단체사진</span>
        <h2>{unlocked ? photo.title : `${label} 네 친구의 기념사진`}</h2>
        <p>
          {unlocked
            ? "네 친구를 모두 모았어요. 단체사진을 선물로 받아보세요!"
            : `${label} 캐릭터 ${total}명을 계정 도감에 모으면 사진이 열려요. 도착한 선물도 개봉해 주세요.`}
        </p>
        <div className="special-card-progress">
          <strong>
            {collected}
            <span> / {total}</span>
          </strong>
          <span>
            {unlocked
              ? "단체사진 획득 완료"
              : `${total - collected}명을 더 모으면 완성!`}
          </span>
        </div>
      </div>
      {unlocked ? (
        <>
          <div className="special-photo-frame">
            <SpecialPhoto photo={photo} active={!expanded} />
          </div>
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => setExpanded(true)}
            >
              단체사진 크게 보기
            </button>
            <a
              className="text-link"
              href={photoUrl(photo, "download=1")}
              download={photo.filename}
            >
              이미지 저장하기 ↓
            </a>
            <a
              className="text-link"
              href={`${photo.videoUrl}&download=1`}
              download={`공부캐-${label}-단체영상.mp4`}
            >
              8초 영상 저장하기 ↓
            </a>
          </div>
        </>
      ) : (
        <div
          className="special-card-sealed has-silhouettes"
          aria-label="아직 열리지 않은 단체사진"
        >
          <GroupPhotoSilhouette modality={modality} />
          <strong>네 친구가 모이면, 찰칵!</strong>
          <p>{label} 4 / 4에서 공개돼요</p>
        </div>
      )}
      {expanded && unlocked && (
        <SpecialPhotoDialog photo={photo} close={() => setExpanded(false)} />
      )}
    </section>
  );
}
