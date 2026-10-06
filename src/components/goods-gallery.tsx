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
export function GoodsGallery({
  initialOwned = false,
}: {
  initialOwned?: boolean;
}) {
  const collection = useCollection();
  const goods = useGoods();
  const [ownedOnly, setOwnedOnly] = useState(initialOwned);
  const [character, setCharacter] = useState("all");
  const [kind, setKind] = useState("all");
  const [mine, setMine] = useState(false);
  const [active, setActive] = useState<GoodsCard | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const ownedCharacters = new Set(collection.data.cards.map((c) => c.code));
  const visible = GOODS.filter(
    (c) =>
      (character === "all" || c.code === character) &&
      (kind === "all" || c.kind === kind) &&
      (!mine || ownedCharacters.has(c.code)) &&
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
            <br />
            카드를 뒤집으면 나에게 들려주는 이야기가 있어요.
          </p>
        </div>
        <div className={styles.heroCards} aria-hidden="true">
          <Image
            src="/goods/visual-solo-planned--daily-02.webp"
            alt=""
            width={180}
            height={270}
          />
          <Image
            src="/goods/visual-solo-planned--special-01.webp"
            alt=""
            width={180}
            height={270}
          />
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
          aria-pressed={character === "all"}
          onClick={() => setCharacter("all")}
        >
          <strong>모든 친구</strong>
          <small>128가지 순간</small>
        </button>
        {characters.map(([code, c]) => (
          <button
            key={code}
            aria-pressed={character === code}
            onClick={() => setCharacter(code)}
          >
            <Image src={avatar(code)} alt="" width={44} height={44} />
            <strong>{c.name}</strong>
            <small>
              {ownedCharacters.has(code) ? "함께하는 친구" : "8장의 이야기"}
            </small>
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
          <label>
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => setMine(e.target.checked)}
            />
            내 공부캐만
          </label>
        </div>
        <div className={styles.heading}>
          <h2>
            {character === "all"
              ? "모든 친구의 컬렉션"
              : `${CHARACTERS[character].name}의 컬렉션`}
          </h2>
          <span>{visible.length}장 / 128장</span>
        </div>
        {(mine && !collection.loaded) || (ownedOnly && !goods.loaded) ? (
          <p role="status">내 공부캐를 불러오고 있어요…</p>
        ) : (mine && collection.error) || (ownedOnly && goods.error) ? (
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
                  <GoodsFace card={card} />
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
          (!mine || collection.loaded) &&
          (!ownedOnly || goods.loaded) &&
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
                    setMine(false);
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
      {active && (
        <GoodsDialog
          key={active.id}
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
}: {
  card: GoodsCard;
  back?: boolean;
}) {
  return (
    <div
      className={`${styles.card} ${card.kind === "special" ? styles.special : ""}`}
    >
      {back ? (
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
          <GoodsFace card={card} back={back} />
        </div>
        <div className={styles.copy}>
          <span className="eyebrow">
            {card.kind === "daily" ? "DAILY MOMENT" : "SPECIAL COSTUME"}
          </span>
          <h2 id="goods-title">{card.title}</h2>
          <p>{card.back.story}</p>
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
