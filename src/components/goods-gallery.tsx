"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GOODS, goodsKindLabel, type GoodsCard } from "@/lib/goods";
import { CHARACTERS } from "@/lib/characters";
import { useCollection } from "./collection-provider";
import styles from "./goods-gallery.module.css";
import { useGoods } from "./goods-provider";
import { Star, StarWallet } from "./star-wallet";
import { goodsPrice } from "@/lib/goods";
import { GoodsActions } from "./goods-actions";
import { GoodsReveal } from "./goods-reveal";
import { GoodsMotionPlayer } from "./goods-motion-player";

const characters = Object.entries(CHARACTERS);
function avatar(code: string) {
  return `/characters/thumbs/${code}${code === "auditory-solo-flexible" ? "-v2" : ""}.png`;
}
export function GoodsGallery() {
  const collection = useCollection();
  const goods = useGoods();
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [character, setCharacter] = useState("all");
  const [kind, setKind] = useState("all");
  const [active, setActive] = useState<GoodsCard | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const ready =
    collection.loaded && goods.loaded && !collection.error && !goods.error;
  const ownedCharacters = new Set(
    ready && collection.data.signedIn
      ? collection.data.cards.map((c) => c.code)
      : [],
  );
  const available = GOODS.filter((c) => ownedCharacters.has(c.code));
  const selectedCharacter = ownedCharacters.has(character) ? character : "all";
  const visible = available.filter(
    (c) =>
      (selectedCharacter === "all" || c.code === selectedCharacter) &&
      (kind === "all" || c.kind === kind) &&
      (!ownedOnly || goods.progress.owned.includes(c.id)),
  );
  function close() {
    setActive(null);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  return (
    <main id="main" className={`catalog-shell ${styles.page}`}>
      <header className={styles.intro}>
        <div>
          <span className={`eyebrow ${styles.collectionLabel}`}>
            <Image src="/goods/star.webp" width={24} height={24} alt="" />
            STUDYCREW COLLECTION
          </span>
          <h1>
            내가 찾은 공부캐의
            <br />
            <em>
              <mark className={styles.highlight}>새로운 순간</mark>을 모아요.
            </em>
          </h1>
          <p>
            포근한 일상 3장, 상상 속 의상 5장, 움직이는 스페셜 1장.
            <br />
            별로 소장하면 내 공부캐의 그림과 이야기, 특별한 영상이 열려요.
          </p>
        </div>
        <div className={styles.heroCards} aria-hidden="true">
          <div className={styles.heroPack}>
            <Star size={36} />
            <span>DAILY MOMENT</span>
          </div>
          <div className={styles.heroPack}>
            <Star size={36} />
            <span>SPECIAL COLLECTION</span>
          </div>
        </div>
      </header>
      <StarWallet history compact />
      <nav className={styles.characters} aria-label="굿즈 캐릭터">
        <button
          aria-pressed={selectedCharacter === "all"}
          onClick={() => setCharacter("all")}
        >
          <strong>내 공부캐 전체</strong>
          <small>{available.length}가지 순간</small>
        </button>
        {characters
          .filter(([code]) => ownedCharacters.has(code))
          .map(([code, c]) => (
            <button
              key={code}
              aria-pressed={selectedCharacter === code}
              onClick={() => setCharacter(code)}
            >
              <Image src={avatar(code)} alt="" width={44} height={44} />
              <strong>{c.name}</strong>
              <small>함께하는 친구</small>
            </button>
          ))}
      </nav>
      <section aria-label="굿즈 목록">
        <div className={styles.filters}>
          <div className={styles.filterTop}>
            <button
              aria-pressed={kind === "all"}
              onClick={() => setKind("all")}
            >
              전체
            </button>
            <label>
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
              />
              내 굿즈만
            </label>
          </div>
          <div className={styles.kindFilters}>
            {[
              ["daily", "일상 포토카드"],
              ["special", "특별 의상 카드"],
              ["motion", "스페셜 모션 카드"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {value === "motion" ? (
                  <Star size={30} />
                ) : (
                  <Image
                    src={`/ui-icons/goods-${value}-v1.webp`}
                    alt=""
                    width={36}
                    height={36}
                  />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.heading}>
          <h2>
            {selectedCharacter === "all"
              ? "내 공부캐의 컬렉션"
              : `${CHARACTERS[selectedCharacter].name}의 컬렉션`}
          </h2>
          <span>
            {visible.length}장 / {available.length}장
          </span>
        </div>
        {!collection.loaded || !goods.loaded ? (
          <p role="status">내 공부캐를 불러오고 있어요…</p>
        ) : collection.error || goods.error ? (
          <div className="notice">
            <p>내 공부캐를 불러오지 못했어요.</p>
            <button
              className="button secondary"
              onClick={() => {
                void collection.refresh();
                void goods.refresh();
              }}
            >
              다시 불러오기
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((card) => (
              <article key={card.id}>
                <button
                  className={styles.open}
                  onClick={(e) => {
                    trigger.current = e.currentTarget;
                    setActive(card);
                  }}
                  aria-label={`${card.name} ${card.title} 카드 보기`}
                >
                  <GoodsFace
                    card={card}
                    locked={!goods.progress.owned.includes(card.id)}
                  />
                </button>
                <div className={styles.itemInfo}>
                  <div>
                    <strong>{card.name}</strong>
                    <small>
                      {goodsKindLabel(card)}{" "}
                      {card.kind === "motion"
                        ? "· 약 15초"
                        : card.theme.slice(-2)}
                    </small>
                  </div>
                  <span>
                    {goods.progress.owned.includes(card.id) ? (
                      "보관 중"
                    ) : (
                      <>
                        <Star size={16} /> {goodsPrice(card)}
                      </>
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
        {!visible.length &&
          collection.loaded &&
          goods.loaded &&
          !goods.error &&
          !collection.error && (
            <div className={styles.empty}>
              <h3>
                {ownedOnly
                  ? "아직 이 조건의 굿즈가 없어요"
                  : "첫 공부 친구를 만나볼까요?"}
              </h3>
              <p>
                {ownedOnly
                  ? "별로 마음에 드는 카드를 교환하면 여기에 보관돼요."
                  : "계정 도감에 저장한 캐릭터의 굿즈를 모아 볼 수 있어요."}
              </p>
              {ownedOnly && (
                <button
                  className="button star-button"
                  onClick={() => {
                    setOwnedOnly(false);
                    setCharacter("all");
                    setKind("all");
                  }}
                >
                  전체 굿즈 둘러보기
                </button>
              )}
              <Link className="button primary" href="/collection">
                내 도감으로 가기
              </Link>
            </div>
          )}
      </section>
      {active && ready && visible.some((card) => card.id === active.id) && (
        <GoodsDialog
          key={`${collection.data.accountId}-${active.id}`}
          card={active}
          close={close}
          previous={visible[visible.findIndex((i) => i.id === active.id) - 1]}
          next={visible[visible.findIndex((i) => i.id === active.id) + 1]}
          select={setActive}
        />
      )}
    </main>
  );
}
export function GoodsFace({
  card,
  back = false,
  locked = false,
}: {
  card: GoodsCard;
  back?: boolean;
  locked?: boolean;
}) {
  return (
    <div
      className={`${styles.card} ${card.kind !== "daily" ? styles.special : ""}`}
    >
      {locked ? (
        <div className={`${styles.back} ${styles.locked}`}>
          <span>
            {card.kind === "motion"
              ? "SPECIAL MOTION"
              : card.kind === "daily"
                ? "DAILY MOMENT"
                : "SPECIAL COLLECTION"}
          </span>
          <Star size={36} />
          <h3>{card.title}</h3>
          <p>아직 열리지 않은 순간</p>
          <small>
            {card.kind === "motion"
              ? "별 3개로 소장하면 움직이는 순간이 열려요"
              : "소장하면 그림과 이야기가 열려요"}
          </small>
        </div>
      ) : back ? (
        <div className={styles.back}>
          <span>
            {card.back.edition} · {card.name}
          </span>
          <Image src={avatar(card.code)} alt="" width={58} height={58} />
          <h3>{card.title}</h3>
          <p>{card.back.story}</p>
          <blockquote>“{card.back.quote}”</blockquote>
          <small>— {card.name}의 한마디</small>
        </div>
      ) : (
        <>
          <Image
            src={`/goods/${card.id}.webp?v=${card.imageVersion}`}
            alt={`${card.name} · ${card.title}`}
            width={384}
            height={576}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
          />
          {card.kind !== "daily" && (
            <span className={styles.seal}>
              {card.kind === "motion"
                ? "▶ SPECIAL MOTION"
                : "SPECIAL COLLECTION"}
            </span>
          )}
          <div className={styles.caption}>
            <strong>{card.title}</strong>
            <small>
              {card.name} / {card.theme.toUpperCase()}
            </small>
          </div>
        </>
      )}
    </div>
  );
}
function GoodsDialog({
  card,
  close,
  previous,
  next,
  select,
}: {
  card: GoodsCard;
  close: () => void;
  previous?: GoodsCard;
  next?: GoodsCard;
  select: (card: GoodsCard) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [back, setBack] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [playOnOpen, setPlayOnOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const goods = useGoods();
  const owned =
    goods.loaded && !goods.error && goods.progress.owned.includes(card.id);
  useEffect(() => {
    dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="goods-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.dialogHead}>
        <strong>{card.name} · COLLECTION</strong>
        <button ref={closeButton} className="button secondary" onClick={close}>
          닫기
        </button>
      </div>
      <div
        className={styles.detail}
        inert={revealing}
        style={revealing ? { visibility: "hidden" } : undefined}
      >
        <div className={styles.large}>
          {card.kind === "motion" && owned && !back ? (
            <GoodsMotionPlayer
              card={card}
              autoPlay={playOnOpen && !revealing}
            />
          ) : (
            <GoodsFace card={card} back={back} locked={!owned} />
          )}
        </div>
        <div className={styles.copy}>
          <span className="eyebrow">
            {card.kind === "motion"
              ? "SPECIAL MOTION · 약 15초"
              : card.kind === "daily"
                ? "DAILY MOMENT"
                : "SPECIAL COSTUME"}
          </span>
          <h2 id="goods-title">{card.title}</h2>
          <p>
            {owned
              ? card.back.story
              : card.kind === "motion"
                ? "별 3개로 봉인을 열면 약 15초의 특별한 순간이 움직이기 시작해요. 한 번 소장하면 언제든 다시 재생할 수 있어요."
                : "어떤 순간이 담겨 있을까요? 별로 이 카드를 소장하면 그림과 나에게 전하는 이야기를 볼 수 있어요."}
          </p>
          {owned && (
            <div className={styles.actions}>
              <button
                className="button secondary"
                aria-pressed={back}
                onClick={() => {
                  setBack((v) => !v);
                  dialog.current?.scrollTo({ top: 0 });
                }}
              >
                {back ? "앞면 보기" : "뒷면 보기"}
              </button>
              {card.kind === "motion" && (
                <button
                  className="button secondary"
                  onClick={() => {
                    setBack(false);
                    setPlayOnOpen(false);
                    setRevealing(true);
                    dialog.current?.scrollTo({ top: 0 });
                  }}
                >
                  해금 연출 다시 보기
                </button>
              )}
            </div>
          )}
          <div className={styles.paging}>
            <button
              className="button secondary"
              disabled={!previous}
              onClick={() => previous && select(previous)}
            >
              ← 이전 카드
            </button>
            <button
              className="button secondary"
              disabled={!next}
              onClick={() => next && select(next)}
            >
              다음 카드 →
            </button>
          </div>
          <GoodsActions
            card={card}
            back={back}
            onRedeemed={() => {
              setBack(false);
              dialog.current?.scrollTo({ top: 0 });
              setRevealing(true);
            }}
          />
        </div>
      </div>
      {revealing && (
        <GoodsReveal
          card={card}
          onFinish={() => {
            setRevealing(false);
            setPlayOnOpen(true);
            closeButton.current?.focus();
          }}
        />
      )}
    </dialog>
  );
}
