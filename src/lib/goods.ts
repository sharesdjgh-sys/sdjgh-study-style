import catalog from "./goods-catalog.json" with { type: "json" };
export type GoodsCard = (typeof catalog)[number];
export const GOODS = catalog;
export const goodsPrice = (card: GoodsCard) => (card.kind === "daily" ? 1 : 2);
export const getGoods = (id: string) => GOODS.find((card) => card.id === id);
export type GoodsProgress = {
  balance: number;
  owned: string[];
  families: string[];
  entries: {
    id: string;
    amount: number;
    reason: "practice" | "family" | "goods";
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
