"use client";
import styles from "./goods-gallery.module.css";
import Image from "next/image";
import { useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import {
  equippedOutfit,
  itemImage,
  outfitImage,
  isWorn,
  wardrobe,
  wearableId,
  wearableOptions,
  type Outfit,
  type WearableOption,
} from "@/lib/wearables";
import { useGoods } from "./goods-provider";

export function Wearable({
  code,
  detail = false,
  selected,
}: {
  code: string;
  detail?: boolean;
  selected?: WearableOption;
}) {
  const goods = useGoods();
  const character = CHARACTERS[code];
  const worn = equippedOutfit(code, goods.progress.equipped ?? []);
  const [trial, setTrial] = useState<Partial<Outfit>>(() =>
    selected === "clothes"
      ? { clothes: true }
      : selected
        ? { accessory: selected }
        : {},
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const outfit = { ...worn, ...trial };
  const slots = wearableOptions.filter((slot) =>
    selected
      ? slot === selected
      : !detail || goods.progress.owned.includes(wearableId(code, slot)),
  );
  if (!slots.length) return null;

  async function act(slot: WearableOption, owned: boolean) {
    setBusy(true);
    setMessage("");
    try {
      await goods.redeem(
        wearableId(code, slot),
        owned ? !isWorn(worn, slot) : undefined,
      );
      if (owned)
        setTrial((current) => {
          const next = { ...current };
          delete next[slot === "clothes" ? "clothes" : "accessory"];
          return next;
        });
      setMessage(
        wardrobe[code][slot] +
          (owned
            ? isWorn(worn, slot)
              ? " 착용을 해제했어요."
              : " 착용했어요."
            : " 구매했어요."),
      );
    } catch {
      setMessage("저장 결과를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={selected ? styles.detail : "wearable-item"}>
      {selected && (
        <div className={styles.large}>
          <div className={`${styles.card} ${styles.wearableFace}`}>
            <Image
              src={outfitImage(code, outfit)}
              alt={character.name + " 착용 미리보기"}
              width={400}
              height={600}
            />
            <div className={styles.caption}>
              <strong>{character.name}</strong>
            </div>
          </div>
        </div>
      )}
      <div className={selected ? styles.copy : undefined}>
        {selected ? (
          <>
            <h2>{wardrobe[code][selected]}</h2>
            <p>아이템을 눌러 {character.name}에게 입혀 보세요.</p>
            <div
              className={styles.tryOptions}
              role="group"
              aria-label="착용 조합"
            >
              {wearableOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  aria-pressed={isWorn(outfit, option)}
                  aria-label={wardrobe[code][option] + " 입혀 보기"}
                  onClick={() =>
                    setTrial((current) =>
                      option === "clothes"
                        ? { ...current, clothes: !outfit.clothes }
                        : {
                            ...current,
                            accessory:
                              outfit.accessory === option ? null : option,
                          },
                    )
                  }
                >
                  <Image
                    src={itemImage(code, option)}
                    alt=""
                    width={48}
                    height={48}
                  />
                  {wardrobe[code][option]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <h3>{character.name}의 옷장</h3>
        )}
        {slots.map((slot) => {
          const id = wearableId(code, slot);
          const owned = goods.progress.owned.includes(id);
          const name = wardrobe[code][slot];
          const label = !owned
            ? goods.progress.balance < 2
              ? "별 2개가 필요해요"
              : "별 2개로 구매"
            : isWorn(worn, slot)
              ? "착용 해제"
              : "착용하기";
          return (
            <section className="wardrobe-product" aria-label={name} key={slot}>
              <Image
                src={itemImage(code, slot)}
                alt={name + " 단품"}
                width={88}
                height={88}
              />
              <div>
                <small>{slot === "clothes" ? "옷" : "액세서리"}</small>
                <strong>{name}</strong>
              </div>

              <button
                className="button primary"
                disabled={
                  busy ||
                  !goods.loaded ||
                  goods.error ||
                  (!owned && goods.progress.balance < 2)
                }
                onClick={() => act(slot, owned)}
              >
                {label}
              </button>
            </section>
          );
        })}
        <span role="status">{message}</span>
      </div>
    </article>
  );
}
