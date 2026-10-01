"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { specialCardProgress } from "@/lib/special-card";
import { useCollection } from "./collection-provider";
import { Icon } from "./icon";

const photograph = "/api/collection/special-card";

function SpecialPhoto() {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  if (failed)
    return (
      <div className="special-photo-error" role="status">
        <p>사진을 불러오지 못했어요. 도감 완성 기록은 그대로예요.</p>
        <button
          className="button secondary"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          다시 불러오기
        </button>
      </div>
    );
  return (
    <Image
      src={`${photograph}?attempt=${attempt}`}
      alt="열여섯 공부캐가 학교 정원에서 함께 찍은 스페셜 단체사진"
      width={1664}
      height={936}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function SpecialPhotoDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="special-photo-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="special-photo-dialog-heading">
        <div>
          <span className="eyebrow">도감 완성 기념 · 스페셜 카드</span>
          <h2 id={titleId}>우리, 드디어 다 모였다!</h2>
        </div>
        <button className="button secondary" onClick={close}>
          닫기
        </button>
      </div>
      <div className="special-photo-frame">
        <SpecialPhoto />
      </div>
      <div className="special-photo-dialog-footer">
        <p>열여섯 가지 공부 스타일, 함께 남긴 한 장의 추억.</p>
        <a
          className="button primary"
          href={`${photograph}?download=1`}
          download="공부캐-스페셜-단체사진.png"
        >
          단체사진 저장하기
        </a>
      </div>
    </dialog>
  );
}

export function SpecialCollectionCard() {
  const { data, loaded, error } = useCollection();
  const [expanded, setExpanded] = useState(false);
  const { collected, total, unlocked } = specialCardProgress(data);
  if (!loaded || error) return null;
  return (
    <section
      className={`special-collection-card ${unlocked ? "is-unlocked" : "is-locked"}`}
      aria-label="도감 완성 스페셜 카드"
    >
      <div className="special-card-copy">
        <span className="eyebrow">
          <Icon name="stars-linear" size={18} />
          도감 완성 기념 · 스페셜 카드
        </span>
        <h2>
          {unlocked
            ? "우리, 드디어 다 모였다!"
            : "모두 모이면, 한 장의 특별한 추억."}
        </h2>
        <p>
          {unlocked
            ? "열여섯 공부캐를 모두 만났어요. 함께 찍은 단체사진을 선물로 드려요!"
            : "열여섯 캐릭터를 모두 모으고 선물을 개봉하면, 모두 함께 찍은 단체사진이 열려요."}
        </p>
        <div className="special-card-progress">
          <strong>
            {collected}
            <span> / {total}</span>
          </strong>
          <span>
            {unlocked
              ? "스페셜 카드 획득 완료"
              : `${total - collected}명의 친구를 더 만나면 완성!`}
          </span>
        </div>
        {unlocked && (
          <div className="button-row special-card-actions">
            <button
              className="button primary"
              onClick={() => setExpanded(true)}
            >
              단체사진 크게 보기 <Icon name="arrow-right-up-linear" size={18} />
            </button>
            <a
              className="text-link"
              href={`${photograph}?download=1`}
              download="공부캐-스페셜-단체사진.png"
            >
              이미지 저장하기 ↓
            </a>
          </div>
        )}
      </div>
      {unlocked ? (
        <div className="special-photo-open">
          <div className="special-photo-frame">
            <SpecialPhoto />
          </div>
          <button
            onClick={() => setExpanded(true)}
            aria-label="스페셜 단체사진 크게 보기"
          >
            열여섯 친구의 기념사진 · 16:9 <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : (
        <div
          className="special-card-sealed"
          aria-label="아직 열리지 않은 단체사진"
        >
          <span className="special-card-seal" aria-hidden="true">
            ✦
          </span>
          <strong>아직은 비밀이에요</strong>
          <p>16 / 16에서 공개되는 단체사진</p>
        </div>
      )}
      {expanded && unlocked && (
        <SpecialPhotoDialog close={() => setExpanded(false)} />
      )}
    </section>
  );
}
