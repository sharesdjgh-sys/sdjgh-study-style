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
import { useCollection } from "./collection-provider";
export function TypeGallery({
  initial = "all",
}: {
  initial?: Modality | "all";
}) {
  const [filter, setFilter] = useState<Modality | "all">(initial);
  const { first } = useSavedSession();
  const { data, loaded } = useCollection();
  const ownCode = data.signedIn ? data.firstType : first?.result;
  const visibleCodes = new Set(
    loaded
      ? data.signedIn
        ? data.cards.map((card) => card.code)
        : ownCode
          ? [ownCode]
          : []
      : [],
  );
  return (
    <>
      <div className="catalog-discovery-note">
        <div>
          <span className="eyebrow">
            {ownCode
              ? data.signedIn
                ? `발견한 친구 ${data.cards.length} / 16`
                : "나의 첫 친구, 아직 저장 전"
              : "16명의 공부캐, 먼저 만날 친구는 누구?"}
          </span>
          <p>
            {ownCode
              ? "첫 친구는 검사로, 새로운 친구는 초대로 만나요."
              : "첫 검사를 마치고 나만의 친구를 만나보세요. 수집은 로그인 후 시작해요."}
          </p>
        </div>
        <Link
          className="button primary"
          href={ownCode || data.signedIn ? "/collection" : "/quiz"}
        >
          {ownCode || data.signedIn
            ? "내 도감 저장·초대하기 ↗"
            : "내 캐릭터 만나기 →"}
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
          ? "카드를 뒤집어 공부 이야기를 읽어보세요. “너 무슨 공부캐 나왔어?”"
          : "실루엣을 보고 상상해 보세요. 누가 내 친구가 될까요?"}
      </p>
      <div className="type-grid character-gallery">
        {STUDY_TYPES.filter(
          (t) => filter === "all" || t.modality === filter,
        ).map((t) => (
          <div className="type-tile character-tile" key={t.code}>
            {visibleCodes.has(t.code) ? (
              <div className="own-character-slot">
                <span className="own-character-badge">
                  {t.code === ownCode
                    ? "✦ 나의 첫 캐릭터"
                    : "✦ 초대로 만난 친구"}
                </span>
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
