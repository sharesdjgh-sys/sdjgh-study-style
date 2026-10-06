"use client";
import { useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  METHOD_IDS,
  getMethod,
  methodOwner,
  type MethodCategory,
  type MethodId,
} from "@/lib/methods";
import { skillPrice } from "@/lib/skill-economy";
import { useSkills } from "./skill-provider";
import { MethodIcon } from "./method-icon";
import { Heart, SkillWallet } from "./skill-ui";
import { Mission } from "./mission";
import { CHARACTERS } from "@/lib/characters";
import { SignatureBadge, SkillModality } from "./skill-badges";
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
  return (
    <>
      <div id="skill-wallet" tabIndex={-1}>
        <SkillWallet />
      </div>
      <p className="skill-catalog-guide">
        왼쪽 위는 공부 방식, 캐릭터 배지는 내가 연 시그니처예요. 다른 유형의
        스킬도 자유롭게 써 보세요.
      </p>
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
                  <button
                    type="button"
                    onClick={(e) => {
                      trigger.current = e.currentTarget;
                      setOpen(id);
                    }}
                    aria-label={`${m.name}${unlocked ? " · 열림" : ` · 하트 ${skillPrice(id)}개로 열기`}${unlocked && owner.kind === "signature" ? ` · ${CHARACTERS[owner.code].name} 시그니처 배지 획득` : ""}`}
                    aria-haspopup="dialog"
                    className="skill-tile"
                    data-unlocked={unlocked}
                    data-signature={owner.kind === "signature"}
                    key={id}
                  >
                    <SkillModality id={id} />
                    <span className="skill-tile-art">
                      <MethodIcon id={id} size={112} />
                    </span>
                    <h3>{m.name}</h3>
                    <span className="skill-tile-bottom">
                      {unlocked ? (
                        owner.kind === "signature" ? (
                          <span className="skill-signature-earned">
                            <SignatureBadge code={owner.code} />
                            <span>
                              <strong>{CHARACTERS[owner.code].name}</strong>
                              <small>시그니처 획득</small>
                            </span>
                          </span>
                        ) : (
                          <span className="skill-earned-label">스킬 획득</span>
                        )
                      ) : (
                        <>
                          <Heart size={20} />
                          <b>{skillPrice(id)}</b>
                        </>
                      )}
                    </span>
                  </button>
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
          if (e.target !== e.currentTarget) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }}
      >
        <div className="skill-sheet-top">
          <span>나의 공부 스킬북</span>
          <button type="button" className="button secondary" onClick={close}>
            닫기
          </button>
        </div>
        {open && <Mission key={open} methodId={open} onClose={close} />}
      </dialog>
    </>
  );
}
