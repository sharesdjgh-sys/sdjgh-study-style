"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getType, type Modality } from "@/lib/content";
import {
  CATEGORIES,
  METHOD_IDS,
  getMethod,
  methodOwner,
  type MethodCategory,
  type MethodId,
} from "@/lib/methods";
import { Icon } from "./icon";
import { MethodMeta } from "./method-meta";
import { MethodIcon } from "./method-icon";
import { ownerLabel, useVisibleCodes } from "./method-owner";

const CATEGORY_KEYS = Object.keys(CATEGORIES) as MethodCategory[];
const idsOf = (category: MethodCategory) =>
  METHOD_IDS.filter((id) => getMethod(id).category === category);
const familyOf = (id: MethodId): Modality => {
  const owner = methodOwner(id);
  return owner.kind === "family"
    ? owner.modality
    : getType(owner.code)!.modality;
};
const MOBILE = "(max-width: 767px)";

/**
 * 공부법 28가지를 과제별로 묶어 보여 줘요.
 * 데스크톱은 카드, 모바일은 아이콘 타일이고 누르면 아래에서 설명 팝업이 올라와요.
 */
export function MethodCatalog() {
  const [open, setOpen] = useState<MethodId | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const visible = useVisibleCodes();
  useEffect(() => {
    if (open && !sheet.current?.open) sheet.current?.showModal();
  }, [open]);
  function preview(event: MouseEvent, id: MethodId) {
    if (!window.matchMedia(MOBILE).matches) return;
    event.preventDefault();
    setOpen(id);
  }
  function close() {
    sheet.current?.close();
    setOpen(null);
  }
  const method = open ? getMethod(open) : null;
  const label = open ? ownerLabel(open, visible) : null;
  return (
    <>
      {CATEGORY_KEYS.map((category) => (
        <section
          className="catalog-group"
          key={category}
          aria-labelledby={`catalog-${category}`}
        >
          <div className="catalog-group-head">
            <h2 id={`catalog-${category}`}>
              <MethodIcon
                id={category}
                size={44}
                sizes="(max-width: 767px) 36px, 44px"
              />
              {CATEGORIES[category].label} <span>{idsOf(category).length}</span>
            </h2>
          </div>
          <div className="catalog-grid">
            {idsOf(category).map((id, index) => {
              const m = getMethod(id);
              const owner = ownerLabel(id, visible);
              const family = familyOf(id);
              return (
                <Link
                  className="method-preview-card catalog-card"
                  data-family={family}
                  data-signature={owner.signature ? "true" : undefined}
                  href={`/methods/${id}`}
                  key={id}
                  onClick={(event) => preview(event, id)}
                >
                  <span className="catalog-icon" aria-hidden="true">
                    <MethodIcon
                      id={id}
                      size={88}
                      sizes="(max-width: 767px) 64px, 88px"
                      loading={
                        category === CATEGORY_KEYS[0] && index === 0
                          ? "eager"
                          : "lazy"
                      }
                    />
                    {owner.signature && <span>★</span>}
                  </span>
                  <span className="method-preview-family">
                    {owner.signature && <span aria-hidden="true">★</span>}
                    {owner.short}
                  </span>
                  <h3>{m.name}</h3>
                  <span className="catalog-aka">{m.aka[0]}</span>
                  <p>{m.oneLine}</p>
                  <MethodMeta method={m} />
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
      <dialog
        ref={sheet}
        className="method-sheet"
        data-family={open ? familyOf(open) : undefined}
        aria-labelledby="method-sheet-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          // 팝업 바깥(어두운 배경)을 누르면 닫아요.
          if (event.target === event.currentTarget) close();
        }}
      >
        {open && method && label && (
          <div className="method-sheet-body">
            <span className="method-sheet-handle" aria-hidden="true" />
            <MethodIcon id={open} size={80} className="method-sheet-icon" />
            <p className="method-sheet-owner">
              {label.signature && <span aria-hidden="true">★ </span>}
              {label.short}
            </p>
            <h2 id="method-sheet-title">{method.name}</h2>
            <p className="method-aka">{method.aka.join(" · ")}</p>
            <p className="method-sheet-line">{method.oneLine}</p>
            <MethodMeta method={method} />
            <ol className="method-sheet-steps">
              {method.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="method-sheet-actions">
              <Link className="button primary" href={`/methods/${open}`}>
                <Icon name="clock-circle-linear" size={18} />
                10분 해보기
              </Link>
              <button className="button secondary" onClick={close}>
                닫기
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
