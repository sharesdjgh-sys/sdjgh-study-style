import type { CSSProperties } from "react";
import { CATALOG_CARD_THEMES } from "@/lib/catalog-card-themes";
import { type StudyType } from "@/lib/content";
import { CharacterCard } from "./character-card";
import { MysteryCard } from "./mystery-card";
import styles from "./catalog-card.module.css";

export function CatalogCard({
  type,
  discovered,
}: {
  type: StudyType;
  discovered: boolean;
}) {
  const theme = CATALOG_CARD_THEMES[type.code];
  const style = {
    "--card-ink": theme.ink,
    "--card-tint": theme.tint,
    "--card-line": theme.rim,
  } as CSSProperties;
  return (
    <div
      className={styles.palette}
      style={style}
      data-character={type.code}
      data-discovered={discovered}
    >
      {discovered ? (
        <CharacterCard type={type} detailLink />
      ) : (
        <MysteryCard type={type} revealName />
      )}
    </div>
  );
}
