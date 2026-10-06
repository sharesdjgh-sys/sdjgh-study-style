"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  CATEGORIES,
  METHOD_IDS,
  getMethod,
  methodOwner,
  type MethodCategory,
  type MethodId,
} from "@/lib/methods";
import { skillPrice } from "@/lib/skill-economy";
import { CHARACTERS } from "@/lib/characters";
import { useSkills } from "./skill-provider";
import { MethodIcon } from "./method-icon";
import { Heart, SkillWallet } from "./skill-ui";
import { Mission } from "./mission";
export function MethodCatalog() {
  const { progress } = useSkills();
  const [open, setOpen] = useState<MethodId | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open && !sheet.current?.open) sheet.current?.showModal();
  }, [open]);
  function close() {
    sheet.current?.close();
    setOpen(null);
    trigger.current?.focus();
  }
  function preview(e: MouseEvent<HTMLAnchorElement>, id: MethodId) {
    if (!matchMedia("(max-width: 767px)").matches) return;
    e.preventDefault();
    trigger.current = e.currentTarget;
    setOpen(id);
  }
  return (
    <>
      <div id="skill-wallet">
        <SkillWallet />
      </div>
      {(Object.keys(CATEGORIES) as MethodCategory[]).map((category) => (
        <section
          className="catalog-group"
          data-category={category}
          key={category}
          aria-labelledby={"catalog-" + category}
        >
          <div className="catalog-group-head">
            <h2 id={"catalog-" + category}>
              <MethodIcon id={category} size={44} />
              {CATEGORIES[category].label}
              <span>
                {
                  METHOD_IDS.filter((id) => getMethod(id).category === category)
                    .length
                }
              </span>
            </h2>
          </div>
          <div className="catalog-grid skill-card-grid">
            {METHOD_IDS.filter((id) => getMethod(id).category === category).map(
              (id) => {
                const m = getMethod(id);
                const owner = methodOwner(id);
                const unlocked = progress.unlocked.includes(id);
                return (
                  <Link
                    href={"/methods/" + id}
                    onClick={(e) => preview(e, id)}
                    className="skill-tile"
                    data-unlocked={unlocked}
                    data-signature={owner.kind === "signature"}
                    key={id}
                  >
                    <span className="skill-tile-kind">
                      {owner.kind === "signature" ? "시그니처" : "기본 스킬"}
                    </span>
                    <span className="skill-tile-art">
                      <MethodIcon id={id} size={112} />
                    </span>
                    <h3>{m.name}</h3>
                    <p>{m.oneLine}</p>
                    <span className="skill-tile-bottom">
                      {unlocked ? (
                        <>
                          <span>
                            {owner.kind === "signature"
                              ? CHARACTERS[owner.code].name + "의 스킬"
                              : "펼쳐 보기"}
                          </span>
                          <b>열림 →</b>
                        </>
                      ) : (
                        <>
                          <Heart size={20} />
                          <b>{skillPrice(id)}</b>
                          <span>하트로 열기</span>
                        </>
                      )}
                    </span>
                    {unlocked && progress.practiced.includes(id) && (
                      <span className="skill-practiced">첫 실천 완료</span>
                    )}
                  </Link>
                );
              },
            )}
          </div>
        </section>
      ))}
      <dialog
        ref={sheet}
        className="skill-sheet"
        aria-label={open ? getMethod(open).name : "스킬 상세"}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="skill-sheet-top">
          <span>나의 공부 스킬북</span>
          <button type="button" className="button secondary" onClick={close}>
            닫기
          </button>
        </div>
        {open && <Mission key={open} methodId={open} />}
      </dialog>
    </>
  );
}
