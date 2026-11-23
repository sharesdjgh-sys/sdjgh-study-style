import catalog from "./wearable-catalog.json" with { type: "json" };
import { CHARACTER_IMAGES } from "./characters";

export const wearableOptions = ["clothes", "accessory", "accessory2"] as const;
export type WearableOption = (typeof wearableOptions)[number];
export type Outfit = {
  clothes: boolean;
  accessory: "accessory" | "accessory2" | null;
};
export const wardrobe = Object.fromEntries(
  catalog.map((row) => [row.code, row]),
);
export function wearableId(code: string, option: WearableOption) {
  if (option === "accessory2") return code + "--wearable-03";
  return (
    code +
    (wardrobe[code].legacySlot === option ? "--wearable-01" : "--wearable-02")
  );
}
const products = new Map(
  catalog.flatMap((row) =>
    wearableOptions.map(
      (option) =>
        [
          wearableId(row.code, option),
          { code: row.code, name: row[option], option },
        ] as const,
    ),
  ),
);
export const wearableCode = (id: string) => products.get(id)?.code;
export const wearableName = (id: string) => products.get(id)?.name;
export function alternateAccessory(id: string) {
  const product = products.get(id);
  if (!product || product.option === "clothes") return null;
  return wearableId(
    product.code,
    product.option === "accessory" ? "accessory2" : "accessory",
  );
}
export function equippedOutfit(code: string, ids: readonly string[]): Outfit {
  return {
    clothes: ids.includes(wearableId(code, "clothes")),
    accessory: ids.includes(wearableId(code, "accessory2"))
      ? "accessory2"
      : ids.includes(wearableId(code, "accessory"))
        ? "accessory"
        : null,
  };
}
export const isWorn = (outfit: Outfit, option: WearableOption) =>
  option === "clothes" ? outfit.clothes : outfit.accessory === option;
export function outfitImage(code: string, outfit: Outfit) {
  if (!outfit.accessory && !outfit.clothes) return CHARACTER_IMAGES[code];
  const state =
    outfit.clothes && outfit.accessory
      ? outfit.accessory === "accessory2"
        ? "both2"
        : "both"
      : (outfit.accessory ?? "clothes");
  return `/wearables/dressing/${state}/${code}.webp`;
}
export const itemImage = (code: string, option: WearableOption) =>
  `/wearables/dressing/items/${option}/${code}.webp`;
