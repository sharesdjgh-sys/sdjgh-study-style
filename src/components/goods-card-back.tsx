import Image from "next/image";
import type { GoodsCard } from "@/lib/goods";
import styles from "./goods-gallery.module.css";

export function PrizeSlip({ number, sample = false }: { number: number; sample?: boolean }) {
  return (
    <div className={styles.prizeSlip}>
      <Image src="/seoipi-prize.png" alt="서잎이" width={48} height={48} />
      <small>서여고 당첨 번호</small>
      <b>{String(number).padStart(2, "0")}번{sample ? " (예시)" : ""}</b>
    </div>
  );
}

export function GoodsCardBack({ card, number, sample = false }: {
  card: GoodsCard;
  number?: number;
  sample?: boolean;
}) {
  return (
    <div className={styles.back}>
      <span>
        {card.back.edition} · {card.name}
      </span>
      <Image src={`/characters/thumbs/${card.code}${card.code === "auditory-solo-flexible" ? "-v2" : ""}.png`} alt="" width={58} height={58} />
      <h3>{card.title}</h3>
      <p>{card.back.story}</p>
      <blockquote>“{card.back.quote}”</blockquote>
      <small>— {card.name}의 한마디</small>
      {(number || sample) && <PrizeSlip number={number ?? 0} sample={sample} />}
    </div>
  );
}
