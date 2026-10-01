import { STUDY_TYPES, type Modality } from "./content";
import type { CollectionData } from "./collection-contract";

export function specialCardProgress(
  collection: Pick<CollectionData, "signedIn" | "cards">,
  modality?: Modality,
) {
  const required = STUDY_TYPES.filter(
    (type) => !modality || type.modality === modality,
  );
  const owned = new Set(collection.cards.map((card) => card.code));
  const collected = required.filter((type) => owned.has(type.code)).length;
  return {
    collected,
    total: required.length,
    unlocked: collection.signedIn && collected === required.length,
  };
}
