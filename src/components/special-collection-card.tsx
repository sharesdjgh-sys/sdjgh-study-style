"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { collectionProgress } from "@/lib/collection-progress";
import { useCollection } from "./collection-provider";
import { Icon } from "./icon";
import { useSavedSession } from "./use-saved-session";
import { CharacterMotion } from "./character-motion";
import { GroupPhotoSilhouette } from "./group-photo-silhouette";

const photograph = "/api/collection/special-card";
export type CollectionPhoto = {
  url: string;
  alt: string;
  title: string;
  caption: string;
  filename: string;
  videoUrl?: string;
};
const fullPhoto: CollectionPhoto = {
  url: photograph,
  alt: "열여섯 공부캐가 학교 정원에서 함께 찍은 스페셜 단체사진",
  title: "우리, 드디어 다 모였다!",
  caption: "열여섯 가지 공부 스타일, 함께 남긴 한 장의 추억.",
  filename: "공부캐-스페셜-단체사진.png",
};
export function photoUrl(photo: CollectionPhoto, query: string) {
  return `${photo.url}${photo.url.includes("?") ? "&" : "?"}${query}`;
}

export function SpecialPhoto({
  photo = fullPhoto,
  active = true,
}: {
  photo?: CollectionPhoto;
  active?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  if (photo.videoUrl)
    return (
      <CharacterMotion
        asset={{ video: photo.videoUrl, poster: photo.url }}
        name={photo.title}
        species=""
        imageAlt={photo.alt}
        active={active}
        priority={false}
        landscape
      />
    );
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
      src={photoUrl(photo, `attempt=${attempt}`)}
      alt={photo.alt}
      width={1664}
      height={936}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

export function SpecialPhotoDialog({
  close,
  photo = fullPhoto,
}: {
  close: () => void;
  photo?: CollectionPhoto;
}) {
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
          <h2 id={titleId}>{photo.title}</h2>
        </div>
        <button className="button secondary" onClick={close}>
          닫기
        </button>
      </div>
      <div className="special-photo-frame">
        <SpecialPhoto photo={photo} />
      </div>
      <div className="special-photo-dialog-footer">
        <p>{photo.caption}</p>
        <a
          className="button primary"
          href={photoUrl(photo, "download=1")}
          download={photo.filename}
        >
          단체사진 저장하기
        </a>
        {photo.videoUrl && (
          <a
            className="button secondary"
            href={`${photo.videoUrl}&download=1`}
            download={photo.filename.replace(/\.png$/, ".mp4")}
          >
            8초 영상 저장하기
          </a>
        )}
      </div>
    </dialog>
  );
}

export function SpecialCollectionCard() {
  const { data, loaded, error } = useCollection();
  const { first } = useSavedSession();
  const [expanded, setExpanded] = useState(false);
  const {
    collected,
    total,
    unlocked,
    pending,
    inviteGoal,
    remainingInvites,
    needsFirst,
    previewOnly,
  } = collectionProgress(data, first?.result);
  if (!loaded || error) return null;
  return (
    <section
      className={`special-collection-card ${unlocked ? "is-unlocked" : "is-locked"}`}
      id="collection-completion"
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
            : previewOnly
              ? `내 공부캐를 계정에 저장하고, 친구 초대로 ${inviteGoal}명을 더 모아보세요. 모두 만나고 선물을 개봉하면 단체사진이 열려요.`
              : `내 공부캐 1명 + 친구 초대 ${inviteGoal}명! 모두 만나고 선물을 개봉하면 단체사진이 열려요.`}
        </p>
        <div className="special-card-progress">
          <strong>
            {collected}
            <span> / {total}</span>
          </strong>
          <span>
            {unlocked
              ? "스페셜 카드 획득 완료"
              : needsFirst
                ? `첫 공부캐를 만나고, 친구 ${inviteGoal}명을 초대해요!`
                : remainingInvites > 0
                  ? `${remainingInvites}명의 친구를 더 초대하면 완성!`
                  : `초대 완료! 선물 ${pending}개만 열면 완성!`}
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
          className="special-card-sealed has-silhouettes"
          aria-label="아직 열리지 않은 단체사진"
        >
          <GroupPhotoSilhouette />
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
