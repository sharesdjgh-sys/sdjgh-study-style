import { getType, STUDY_TYPES } from "./content";
import type { CollectionData } from "./collection-contract";
import { specialCardProgress } from "./special-card";

export function collectionProgress(
  collection: CollectionData,
  firstResult?: string | null,
) {
  const saved = specialCardProgress(collection);
  const registeredFirst = collection.signedIn
    ? getType(collection.firstType ?? "")?.code
    : undefined;
  const previewFirst = registeredFirst
    ? undefined
    : getType(firstResult ?? "")?.code;
  const firstCode = registeredFirst ?? previewFirst;
  const known = new Set(STUDY_TYPES.map((type) => type.code));
  const visibleCodes = new Set(
    collection.signedIn
      ? collection.cards
          .filter((card) => known.has(card.code))
          .map((card) => card.code)
      : [],
  );
  if (previewFirst) visibleCodes.add(previewFirst);
  const collected = visibleCodes.size;
  // Delivered gifts already came from successful invitations. Opening them does
  // not require inviting another friend. Local previews never unlock the photo.
  const pending = collection.signedIn
    ? Math.min(collection.pending.length, saved.total - collected)
    : 0;
  return {
    ...saved,
    collected,
    pending,
    firstCode,
    previewOnly: Boolean(previewFirst),
    needsFirst: !firstCode && collected === 0,
    inviteGoal: saved.total - 1,
    remainingInvites: Math.max(
      0,
      saved.total - Math.max(1, collected) - pending,
    ),
    visibleCodes,
  };
}
