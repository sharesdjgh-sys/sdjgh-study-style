"use client";
import { useState } from "react";
import {
  FAMILIES,
  MODALITIES,
  STUDY_TYPES,
  type Modality,
} from "@/lib/content";
import { CatalogCard } from "./catalog-card";
import Link from "next/link";
import { useSavedSession } from "./use-saved-session";
import { useCollection } from "./collection-provider";
import { SpecialCollectionCard } from "./special-collection-card";
import { FamilyCollectionCard } from "./family-collection-card";
import { collectionProgress } from "@/lib/collection-progress";
import { Icon } from "./icon";
import styles from "./type-gallery.module.css";
export function TypeGallery({
  initial = "all",
  showOverview = true,
}: {
  initial?: Modality | "all";
  showOverview?: boolean;
}) {
  const [filter, setFilter] = useState<Modality | "all">(initial);
  const { first } = useSavedSession();
  const { data, loaded } = useCollection();
  const progress = collectionProgress(data, first?.result);
  const ownCode = progress.firstCode;
  const visibleCodes = loaded ? progress.visibleCodes : new Set<string>();
  const filteredTypes = STUDY_TYPES.filter(
    (type) => filter === "all" || type.modality === filter,
  );
  return (
    <>
      {showOverview && (
        <div className="catalog-discovery-note">
          <div className="catalog-progress-copy">
            <div className="catalog-progress-heading">
              <h2>
                {ownCode
                  ? "한 장씩, 내 도감이 자라요!"
                  : "첫 친구를 만나면, 수집 시작!"}
              </h2>
              <span
                className="catalog-progress-count"
                aria-label={
                  loaded
                    ? `발견한 친구 ${progress.collected}명, 전체 ${progress.total}명`
                    : "도감 불러오는 중"
                }
              >
                {loaded ? progress.collected : "—"}
                <small> / {progress.total}</small>
              </span>
            </div>
            <div className="catalog-progress-slots" aria-hidden="true">
              {STUDY_TYPES.map((type) => (
                <span
                  key={type.code}
                  data-family={type.modality}
                  className={visibleCodes.has(type.code) ? "is-found" : ""}
                />
              ))}
            </div>
            {progress.previewOnly && (
              <span className="catalog-preview-label">
                첫 친구 미리보기 · 아직 저장 전
              </span>
            )}
            <p>
              {ownCode ? (
                <>
                  내 공부캐 <strong>1명</strong> + 친구 초대로{" "}
                  <strong>{progress.inviteGoal}명</strong>
                </>
              ) : (
                <>
                  첫 만남은 <strong>검사로</strong>, 도감 저장은{" "}
                  <strong>로그인 후</strong>.
                </>
              )}
            </p>
          </div>
          <Link
            className={`button primary ${ownCode || data.signedIn ? styles.invitation : ""}`}
            href={ownCode || data.signedIn ? "/collection" : "/quiz"}
          >
            {data.signedIn && data.firstType
              ? "친구 초대하고 선물 받기 ↗"
              : ownCode || data.signedIn
                ? "내 공부캐 도감에 저장하기 ↗"
                : "내 캐릭터 만나기 →"}
          </Link>
        </div>
      )}
      <div className="filter-tabs catalog-family-tabs" aria-label="유형 필터">
        <button
          className={filter === "all" ? "active" : ""}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          <Icon name="stars-linear" size={23} />
          <span>모든 친구</span>
        </button>
        {MODALITIES.map((m) => (
          <button
            key={m}
            className={filter === m ? "active" : ""}
            aria-pressed={filter === m}
            aria-label={FAMILIES[m].label}
            data-family={m}
            onClick={() => setFilter(m)}
          >
            <Icon name={FAMILIES[m].icon} size={23} />
            <span>
              {FAMILIES[m].label}
              <small>{FAMILIES[m].verb} 공부해요</small>
            </span>
          </button>
        ))}
      </div>
      <div className="catalog-gallery-heading">
        <h2>
          {filter === "all"
            ? "저마다 다른 매력의 친구들"
            : `${FAMILIES[filter].label} 친구들을 만나봐요`}
        </h2>
        <p className="character-gallery-hint">
          {ownCode
            ? "만난 친구의 카드를 뒤집어 공부 이야기를 읽어보세요."
            : "이름과 실루엣으로 먼저 만나요. 발견하면 모습과 이야기가 열려요."}
        </p>
      </div>
      <div className="type-grid character-gallery">
        {filteredTypes.map((t) => (
          <div
            className="type-tile character-tile"
            key={t.code}
            data-family={t.modality}
          >
            {visibleCodes.has(t.code) ? (
              <div className="own-character-slot">
                <span className="own-character-badge">
                  {t.code === ownCode
                    ? "✦ 나의 첫 캐릭터"
                    : "✦ 초대로 만난 친구"}
                </span>
                <CatalogCard type={t} discovered />
              </div>
            ) : (
              <CatalogCard type={t} discovered={false} />
            )}
          </div>
        ))}
        {filter === "all" && <SpecialCollectionCard />}
        {filter !== "all" && (
          <FamilyCollectionCard key={filter} modality={filter} />
        )}
      </div>
    </>
  );
}
