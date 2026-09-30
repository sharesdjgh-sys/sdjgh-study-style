"use client";
import Link from "next/link";
import { useState } from "react";
import {
  FAMILIES,
  MODALITIES,
  STUDY_TYPES,
  type Modality,
} from "@/lib/content";
import { StudyArt } from "./study-art";
import { Icon } from "./icon";
export function TypeGallery({
  initial = "all",
}: {
  initial?: Modality | "all";
}) {
  const [filter, setFilter] = useState<Modality | "all">(initial);
  return (
    <>
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
      <div className="type-grid">
        {STUDY_TYPES.filter(
          (t) => filter === "all" || t.modality === filter,
        ).map((t) => (
          <Link href={`/types/${t.code}`} className="type-tile" key={t.code}>
            <StudyArt modality={t.modality} asset={t.asset} compact />
            <div className="type-tile-body">
              <span className="eyebrow">{FAMILIES[t.modality].label}</span>
              <h2>{t.name}</h2>
              <p>{t.subtitle}</p>
              <Icon name="arrow-right-up-linear" size={20} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
