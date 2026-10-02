"use client";
import { CHARACTERS } from "@/lib/characters";
import { FAMILIES, getType } from "@/lib/content";
import { methodOwner, type MethodId } from "@/lib/methods";
import { collectionProgress } from "@/lib/collection-progress";
import { useCollection } from "./collection-provider";
import { useSavedSession } from "./use-saved-session";

/** 만난 캐릭터 코드. 불러오기 전에는 아무도 공개하지 않아요. */
export function useVisibleCodes() {
  const { first, loaded } = useSavedSession();
  const { data, loaded: accountLoaded } = useCollection();
  return loaded && accountLoaded
    ? collectionProgress(data, first?.result).visibleCodes
    : new Set<string>();
}

/** 이 공부법을 즐겨 쓰는 공부캐. 아직 만나지 않은 캐릭터는 이름을 숨겨요. */
export function ownerLabel(id: MethodId, visible: Set<string>) {
  const owner = methodOwner(id);
  if (owner.kind === "family")
    return {
      signature: false,
      short: `${FAMILIES[owner.modality].label} 공부캐 4명`,
      long: `${FAMILIES[owner.modality].verb} 정리하는 ${FAMILIES[owner.modality].label} 공부캐 4명이 즐겨 쓰는 공부법이에요.`,
    };
  const modality = getType(owner.code)!.modality;
  if (visible.has(owner.code)) {
    const name = CHARACTERS[owner.code].name;
    return {
      signature: true,
      short: `${name}의 시그니처`,
      long: `${name}의 시그니처 공부법이에요.`,
    };
  }
  return {
    signature: true,
    short: `${FAMILIES[modality].label} 공부캐 한 명의 시그니처`,
    long: `${FAMILIES[modality].label} 공부캐 한 명의 시그니처 공부법이에요. 누구인지는 아직 비밀!`,
  };
}

export function MethodOwner({ id }: { id: MethodId }) {
  const label = ownerLabel(id, useVisibleCodes());
  return (
    <p className="method-owner">
      {label.signature && <span aria-hidden="true">★ </span>}
      {label.long}
    </p>
  );
}
