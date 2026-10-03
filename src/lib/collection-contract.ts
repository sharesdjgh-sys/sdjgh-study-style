export type CollectedCard = { code: string; source: "first" | "referral" };
export type CollectionData = {
  accountId?: string;
  configured: boolean;
  signedIn: boolean;
  firstType: string | null;
  firstRunId: string | null;
  inviteCode: string | null;
  cards: CollectedCard[];
  pending: { id: string }[];
  referralCount: number;
};
export const EMPTY_COLLECTION: CollectionData = {
  configured: false,
  signedIn: false,
  firstType: null,
  firstRunId: null,
  inviteCode: null,
  cards: [],
  pending: [],
  referralCount: 0,
};
