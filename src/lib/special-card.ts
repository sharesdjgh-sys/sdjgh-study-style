import { STUDY_TYPES } from "./content";
import type { CollectionData } from "./collection-contract";

export function specialCardProgress(
  collection: Pick<CollectionData, "signedIn" | "cards">,
) {
  const owned = new Set(collection.cards.map((card) => card.code));
  const collected = STUDY_TYPES.filter((type) => owned.has(type.code)).length;
  return {
    collected,
    total: STUDY_TYPES.length,
    unlocked: collection.signedIn && collected === STUDY_TYPES.length,
  };
}
