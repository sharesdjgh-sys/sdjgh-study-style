/** Campaign copy lives here so quantities and dates can be filled in later. */
export const SDJ_EVENT = {
  id: "sdj-badge-2026",
  path: "/events/sdj",
  title: "우리 학교만의, 조금 특별한 카드.",
  registrationOpen: true,
  schedule: "추후 공개",
  quantity: "카드별 수량 추후 공개",
  prizes: "매점권 · 카드별 상품과 당첨 조건 추후 안내",
} as const;
export type SdjEventSource = "poster_qr" | "event_page";
export type SdjEnrollment = { enrolled: boolean; enrolledAt: string | null };
