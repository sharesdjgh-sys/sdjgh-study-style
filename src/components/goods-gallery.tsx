"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GOODS, type GoodsCard } from "@/lib/goods";
import { CHARACTERS } from "@/lib/characters";
import { useCollection } from "./collection-provider";
import styles from "./goods-gallery.module.css";
import { useGoods } from "./goods-provider";
import { Star, StarWallet } from "./star-wallet";
import { goodsPrice } from "@/lib/goods";
import { GoodsActions } from "./goods-actions";

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
            우리 공부캐의
            <br />
            <em>새로운 순간을 모아요.</em>
          </h1>
          <p>
            포근한 일상 3장, 상상 속 의상 5장.
            <br />내 공부캐의 카드를 모으면 그림과 비밀 이야기가 열려요.
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
      <StarWallet history />
      <div className={styles.tabs}>
        <Link href="/collection">공부친구 수집노트</Link>
        <span aria-current="page">공부캐 굿즈</span>
        <Link href="/methods">공부 스킬북</Link>
      </div>
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
          <div>
            {[
              ["all", "전체"],
              ["daily", "일상 포토카드"],
              ["special", "특별 의상 카드"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label>
            <input
              type="checkbox"
              checked={ownedOnly}
              onChange={(e) => setOwnedOnly(e.target.checked)}
            />
            내 굿즈만
          </label>
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
                      {card.kind === "daily"
                        ? "일상 포토카드"
                        : "특별 의상 카드"}{" "}
                      {card.theme.slice(-2)}
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
      className={`${styles.card} ${card.kind === "special" ? styles.special : ""}`}
    >
      {locked ? (
        <div className={`${styles.back} ${styles.locked}`}>
          <span>
            {card.kind === "daily" ? "DAILY MOMENT" : "SPECIAL COLLECTION"}
          </span>
          <Star size={36} />
          <h3>{card.title}</h3>
          <p>아직 열리지 않은 순간</p>
          <small>소장하면 그림과 이야기가 열려요</small>
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
            src={`/goods/${card.id}.webp`}
            alt={`${card.name} · ${card.title}`}
            width={384}
            height={576}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
          />
          {card.kind === "special" && (
            <span className={styles.seal}>SPECIAL COLLECTION</span>
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
        <button className="button secondary" onClick={close}>
          닫기
        </button>
      </div>
      <div className={styles.detail}>
        <div className={styles.large}>
          <GoodsFace card={card} back={back} locked={!owned} />
        </div>
        <div className={styles.copy}>
          <span className="eyebrow">
            {card.kind === "daily" ? "DAILY MOMENT" : "SPECIAL COSTUME"}
          </span>
          <h2 id="goods-title">{card.title}</h2>
          <p>
            {owned
              ? card.back.story
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
          <GoodsActions card={card} back={back} />
        </div>
      </div>
    </dialog>
  );
}
