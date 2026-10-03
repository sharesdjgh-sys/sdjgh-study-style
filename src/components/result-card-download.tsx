"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import type { Session } from "@/lib/storage";
import { resultCardData } from "@/lib/result-card";

export function ResultCardDownload({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useCardImage(session);
  const data = resultCardData(session);
  return (
    <section className="keepsake-section" aria-label="내 공부캐 이미지 저장">
      <div>
        <span className="eyebrow">MY STUDYCREW CARD</span>
        <h2>내 공부캐, 한 장으로 간직해요.</h2>
        <p>
          {CHARACTERS[session.result!].name}의 공간에 내 점수와 시그니처
          공부법을 담았어요.
        </p>
      </div>
      <div className="keepsake-inline">
        {card.image ? (
          <button
            className="keepsake-inline-open"
            onClick={() => setOpen(true)}
            aria-label="내 공부캐 카드 크게 보기"
          >
            {/* This is the same generated PNG used by the download. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image.url}
              width={1080}
              height={1920}
              alt={`${data.character.name}. ${data.rows.map((r) => `${r.label} ${r.percent}%`).join(", ")}. 시그니처 ${data.method.name}`}
            />
          </button>
        ) : card.error ? (
          <div role="alert">
            <p>{card.error}</p>
            <button className="button secondary" onClick={card.retry}>
              다시 만들기
            </button>
          </div>
        ) : (
          <div className="keepsake-placeholder" role="status">
            내 점수를 담아 카드를 만들고 있어요…
          </div>
        )}
      </div>
      <button
        ref={trigger}
        className="button primary"
        onClick={() => setOpen(true)}
      >
        내 공부캐 이미지로 저장
      </button>
      {open && (
        <CardPreview
          session={session}
          card={card}
          close={() => {
            setOpen(false);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
        />
      )}
    </section>
  );
}
function useCardImage(session: Session) {
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let url = "";
    void import("@/lib/render-result-card")
      .then(({ renderResultCard }) => renderResultCard(session))
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setImage({ url, blob });
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "이미지를 만들지 못했어요.",
          );
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [session, attempt]);
  return {
    image,
    error,
    retry: () => {
      setError("");
      setAttempt((n) => n + 1);
    },
  };
}
function CardPreview({
  session,
  close,
  card,
}: {
  session: Session;
  close: () => void;
  card: ReturnType<typeof useCardImage>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { image } = card;
  const [shareError, setShareError] = useState("");
  const error = card.error || shareError;
  const [sharing, setSharing] = useState(false);
  const data = resultCardData(session);
  const filename = `StudyCrew-${data.character.name}-내공부캐.png`;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function share() {
    if (!image) return;
    const file = new File([image.blob], filename, { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) return;
    setSharing(true);
    try {
      await navigator.share({
        files: [file],
        title: `나의 공부캐 ${data.character.name}`,
      });
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError"))
        setShareError("공유를 마치지 못했어요. PNG 저장으로 간직할 수 있어요.");
    } finally {
      setSharing(false);
    }
  }
  const canShare = Boolean(
    image &&
    typeof navigator !== "undefined" &&
    navigator.canShare?.({
      files: [new File([image.blob], filename, { type: "image/png" })],
    }),
  );
  return (
    <dialog
      ref={dialog}
      className="keepsake-dialog"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="keepsake-heading">
        <h2 id={id}>나의 {data.character.name} 카드</h2>
        <button
          className="button secondary"
          onClick={close}
          aria-label="카드 미리보기 닫기"
        >
          닫기
        </button>
      </div>
      {image ? (
        <>
          {/* A locally generated PNG, not a remotely optimized asset. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="keepsake-preview"
            src={image.url}
            width={1080}
            height={1920}
            alt={`${data.character.name}. ${data.rows.map((r) => `${r.label} ${r.percent}%`).join(", ")}. 시그니처 ${data.method.name}`}
          />
          <div className="keepsake-actions">
            <a className="button primary" href={image.url} download={filename}>
              PNG 저장
            </a>
            {canShare && (
              <button
                className="button secondary"
                disabled={sharing}
                onClick={() => void share()}
              >
                사진으로 공유
              </button>
            )}
          </div>
          <p className="small muted">
            저장 창이 뜨지 않으면 이미지를 길게 눌러 사진에 저장해 주세요. 이
            이미지에는 내 점수가 담겨요.
          </p>
        </>
      ) : (
        !error && <p role="status">내 점수를 담아 카드를 만들고 있어요…</p>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          {!image && (
            <button
              className="button secondary"
              onClick={() => {
                setShareError("");
                card.retry();
              }}
            >
              다시 만들기
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}
