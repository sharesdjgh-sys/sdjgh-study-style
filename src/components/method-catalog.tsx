"use client";
import Link from "next/link";
import { useState } from "react";
import { getType } from "@/lib/content";
import {
  CATEGORIES,
  METHOD_IDS,
  getMethod,
  methodOwner,
  type MethodCategory,
} from "@/lib/methods";
import { Icon } from "./icon";
import { MethodMeta } from "./method-meta";
import { ownerLabel, useVisibleCodes } from "./method-owner";

const CATEGORY_KEYS = Object.keys(CATEGORIES) as MethodCategory[];
const idsOf = (category: MethodCategory) =>
  METHOD_IDS.filter((id) => getMethod(id).category === category);

/** 공부법 28가지를 과제별로 묶어 보여 줘요. */
export function MethodCatalog() {
  const [filter, setFilter] = useState<MethodCategory | "all">("all");
  const visible = useVisibleCodes();
  const shown = CATEGORY_KEYS.filter((c) => filter === "all" || filter === c);
  return (
    <>
      <div
        className="filter-tabs catalog-filter"
        role="group"
        aria-label="공부법 과제 필터"
      >
        <button
          className={filter === "all" ? "active" : ""}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          전체 {METHOD_IDS.length}
        </button>
        {CATEGORY_KEYS.map((c) => (
          <button
            key={c}
            className={filter === c ? "active" : ""}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {CATEGORIES[c].label} {idsOf(c).length}
          </button>
        ))}
      </div>
      {shown.map((category) => (
        <section
          className="catalog-group"
          key={category}
          aria-labelledby={`catalog-${category}`}
        >
          <div className="catalog-group-head">
            <h2 id={`catalog-${category}`}>
              {CATEGORIES[category].label} <span>{idsOf(category).length}</span>
            </h2>
            <p className="catalog-swipe-hint" aria-hidden="true">
              옆으로 넘겨 보기 →
            </p>
          </div>
          <div className="catalog-grid">
            {idsOf(category).map((id) => {
              const method = getMethod(id);
              const owner = methodOwner(id);
              const label = ownerLabel(id, visible);
              return (
                <Link
                  className="method-preview-card catalog-card"
                  data-family={
                    owner.kind === "family"
                      ? owner.modality
                      : getType(owner.code)?.modality
                  }
                  data-signature={label.signature ? "true" : undefined}
                  href={`/methods/${id}`}
                  key={id}
                >
                  <span className="method-preview-family">
                    {label.signature && <span aria-hidden="true">★</span>}
                    {label.short}
                  </span>
                  <h3>{method.name}</h3>
                  <span className="catalog-aka">{method.aka[0]}</span>
                  <p>{method.oneLine}</p>
                  <MethodMeta method={method} />
                  <span className="method-preview-go">
                    <Icon name="clock-circle-linear" size={16} />
                    10분 해보기
                    <Icon name="arrow-right-linear" size={18} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
