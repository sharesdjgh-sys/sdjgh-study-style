"use client";
import { useState } from "react";
import {
  FAMILIES,
  MODALITIES,
  STUDY_TYPES,
  type Modality,
} from "@/lib/content";
import { CharacterCard } from "./character-card";
import Link from "next/link";
import { MysteryCard } from "./mystery-card";
import { useSavedSession } from "./use-saved-session";
export function TypeGallery({
  initial = "all",
}: {
  initial?: Modality | "all";
}) {
  const [filter, setFilter] = useState<Modality | "all">(initial);
  const { session } = useSavedSession();
  const ownCode = session?.result;
  return (
    <>
      <div className="catalog-discovery-note">
        <div>
          <span className="eyebrow">
            {ownCode
              ? "나의 친구, 발견 완료"
              : "16개의 실루엣, 나의 친구는 단 한 명"}
          </span>
          <p>
            {ownCode
              ? "내 캐릭터만 공개됐어요. 다른 친구의 정체는 서로 물어봐요."
              : "검사를 마치면 나와 닮은 캐릭터의 이름과 이야기가 열려요."}
          </p>
        </div>
        <Link
          className="button primary"
          href={ownCode ? "/result#share-style" : "/quiz"}
        >
          {ownCode ? "내 캐릭터 공유하기 ↗" : "내 캐릭터 만나기 →"}
        </Link>
      </div>
      <div className="filter-tabs" aria-label="유형 필터">
        <button
          className={filter === "all" ? "active" : ""}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          전체 16
        </button>
        {MODALITIES.map((m) => (
          <button
            key={m}
            className={filter === m ? "active" : ""}
            aria-pressed={filter === m}
            onClick={() => setFilter(m)}
          >
            {FAMILIES[m].label}
          </button>
        ))}
      </div>
      <p className="character-gallery-hint">
        {ownCode
          ? "공개된 내 카드는 뒤집어서 소개를 읽을 수 있어요. “넌 어떤 캐릭터 나왔어?”"
          : "실루엣을 보고 상상해 보세요. 누가 내 친구가 될까요?"}
      </p>
      <div className="type-grid character-gallery">
        {STUDY_TYPES.filter(
          (t) => filter === "all" || t.modality === filter,
        ).map((t) => (
          <div className="type-tile character-tile" key={t.code}>
            {t.code === ownCode ? (
              <div className="own-character-slot">
                <span className="own-character-badge">✦ 나의 캐릭터</span>
                <CharacterCard type={t} detailLink />
              </div>
            ) : (
              <MysteryCard type={t} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
