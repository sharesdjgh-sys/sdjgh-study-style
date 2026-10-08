import catalog from "./goods-catalog.json" with { type: "json" };
import motionCatalog from "./goods-motion-catalog.json" with { type: "json" };
export type GoodsCard = (typeof catalog)[number] & { video?: string };
export const GOODS: GoodsCard[] = [...catalog, ...motionCatalog];
export const goodsPrice = (card: GoodsCard) =>
  card.kind === "motion" ? 3 : card.kind === "daily" ? 1 : 2;
export const goodsKindLabel = (card: GoodsCard) =>
  card.kind === "motion"
    ? "스페셜 모션 카드"
    : card.kind === "daily"
      ? "일상 포토카드"
      : "특별 의상 카드";
export const getGoods = (id: string) => GOODS.find((card) => card.id === id);
export type GoodsProgress = {
  balance: number;
  owned: string[];
  families: string[];
  entries: {
    id: string;
    amount: number;
    reason: "practice" | "family" | "goods" | "card";
    reference: string;
    createdAt: string;
  }[];
};
export const EMPTY_GOODS: GoodsProgress = {
  balance: 0,
  owned: [],
  families: [],
  entries: [],
};
