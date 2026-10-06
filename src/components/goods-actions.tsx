"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { goodsPrice, type GoodsCard } from "@/lib/goods";
import { useGoods } from "./goods-provider";
import { useCollection } from "./collection-provider";
import { useAuth } from "./auth-provider";
import { useConfirm } from "./ui/confirm-dialog";
import { Star } from "./star-wallet";
const errors: Record<string, string> = {
  insufficient_stars: "별이 부족해요. 첫 실천이나 유형 완성으로 모아 보세요.",
  character_required: "먼저 이 공부캐를 계정 도감에 모아 주세요.",
  unauthorized: "로그인 상태를 확인해 주세요.",
  rate_limit: "잠시 후 다시 시도해 주세요.",
  unavailable:
    "교환 결과를 확인하지 못했어요. 내 굿즈를 확인한 뒤 다시 시도해 주세요. 중복으로 별을 차감하지 않아요.",
};
export function GoodsActions({
  card,
  back,
}: {
  card: GoodsCard;
  back: boolean;
}) {
  const goods = useGoods(),
    collection = useCollection(),
    auth = useAuth();
  const owned = goods.progress.owned.includes(card.id),
    hasCharacter = collection.data.cards.some((c) => c.code === card.code);
  const [confirm, dialog] = useConfirm();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function redeem() {
    if (lock.current) return;
    lock.current = true;
    try {
      const accepted = await confirm({
        eyebrow: "새로운 한 장을 내 컬렉션에",
        title: `${card.name}의 카드를 가져올까요?`,
        description: `${card.title} · 별 ${goodsPrice(card)}개를 사용해요.`,
        note: `현재 ${goods.progress.balance}개 → 교환 후 ${goods.progress.balance - goodsPrice(card)}개. 한 번 교환한 굿즈는 계정에 남고, 다시 저장할 때 별을 쓰지 않아요.`,
        confirmLabel: `별 ${goodsPrice(card)}개로 교환`,
      });
      if (!accepted) return;
      setBusy(true);
      setMessage("");
      const outcome = await goods.redeem(card.id);
      setMessage(
        outcome === "already_owned"
          ? "이미 내 굿즈에 보관한 카드예요."
          : "새로운 한 장이 내 굿즈에 들어왔어요!",
      );
    } catch (e) {
      setMessage(errors[(e as Error).message] ?? errors.unavailable);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="goods-actions">
      {owned ? (
        <>
          <p className="goods-earned">
            <Star /> 내 굿즈에 보관한 카드예요
          </p>
          <GoodsDownload
            key={`${collection.data.accountId}-${card.id}-${back}`}
            card={card}
            back={back}
          />
        </>
      ) : !goods.signedIn ? (
        <>
          <p>
            모든 카드는 미리 볼 수 있어요. 로그인하면 내 공부캐의 굿즈를 별로
            교환할 수 있어요.
          </p>
          <button
            className="button star-button"
            disabled={auth.busy || !auth.session.configured}
            onClick={() => void auth.login()}
          >
            카카오 로그인하고 모으기
          </button>
        </>
      ) : !goods.loaded || !collection.loaded ? (
        <p role="status">나의 별과 공부캐를 확인하고 있어요…</p>
      ) : goods.error || collection.error ? (
        <button
          className="button secondary"
          onClick={() => {
            void goods.refresh();
            void collection.refresh();
          }}
        >
          연결 다시 확인
        </button>
      ) : !hasCharacter ? (
        <>
          <p>
            아직 만나지 않은 {card.name}의 굿즈예요. 먼저 캐릭터 카드를 도감에
            모아 주세요.
          </p>
          <Link className="button secondary" href="/collection">
            공부캐 만나러 가기 →
          </Link>
        </>
      ) : (
        <>
          <p>
            일상 <strong>1별</strong> · 특별 의상 <strong>2별</strong>
            <br />
            보유한 별 {goods.progress.balance}개
          </p>
          <button
            className="button star-button"
            disabled={busy || goods.progress.balance < goodsPrice(card)}
            onClick={() => void redeem()}
          >
            <Star />
            {busy ? "보관하는 중…" : `별 ${goodsPrice(card)}개로 교환하기`}
          </button>
          {goods.progress.balance < goodsPrice(card) && (
            <>
              <p className="small">
                별이 {goodsPrice(card) - goods.progress.balance}개 더 필요해요.
              </p>
              <Link className="text-link" href="/methods">
                첫 10분 실천으로 별 모으기 →
              </Link>
            </>
          )}
        </>
      )}
      {message && (
        <p role="status" className={owned ? "goods-earned" : "notice"}>
          {message}
        </p>
      )}
      {dialog}
    </div>
  );
}
function GoodsDownload({ card, back }: { card: GoodsCard; back: boolean }) {
  const source = `/api/goods/image?id=${card.id}&side=${back ? "back" : "front"}`;
  const filename = `StudyCrew-${card.name}-${card.title}-${back ? "뒷면" : "앞면"}.jpg`;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void fetch(source, { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        if (!r.ok || !r.headers.get("content-type")?.startsWith("image/jpeg"))
          throw Error("이미지를 준비하지 못했어요. 다시 시도해 주세요.");
        return r.blob();
      })
      .then((blob) => {
        if (active) setFile(new File([blob], filename, { type: "image/jpeg" }));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [source, filename, attempt]);
  async function share() {
    if (!file || sharing) return;
    setSharing(true);
    try {
      await navigator.share({
        files: [file],
        title: `${card.name}의 공부캐 굿즈`,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError("공유를 마치지 못했어요. 이미지 열기로 저장할 수 있어요.");
    } finally {
      setSharing(false);
    }
  }
  const canShare =
    !!file &&
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [file] });
  return (
    <div className="goods-download">
      <p className="small">
        지금 보는 <strong>{back ? "뒷면" : "앞면"}</strong>을 저장해요.
      </p>
      <a
        className="button goods-save"
        href={`${source}&download=1`}
        download={filename}
      >
        이미지 저장
      </a>
      <a
        className="button goods-open"
        href={source}
        target="_blank"
        rel="noopener noreferrer"
      >
        이미지 열기
      </a>
      {canShare && (
        <button
          className="button goods-share"
          disabled={sharing}
          onClick={() => void share()}
        >
          {sharing ? "공유 중…" : "사진으로 공유"}
        </button>
      )}
      <p className="small muted">
        카카오톡 안에서 저장이 어려우면 이미지 열기 후 길게 눌러 저장하거나 외부
        브라우저로 열어 주세요.
      </p>
      {error && (
        <p role="status">
          {error}{" "}
          <button
            className="text-link"
            onClick={() => {
              setError("");
              setAttempt((a) => a + 1);
            }}
          >
            다시 준비
          </button>
        </p>
      )}
    </div>
  );
}
