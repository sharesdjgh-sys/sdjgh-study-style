import type { Metadata } from "next";
import { PersonalResult } from "@/components/result";
import { Suspense } from "react";
export const metadata: Metadata = {
  title: "나의 공부캐와 공부 스타일",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <main id="main" className="empty-state">
          내 결과를 불러오고 있어요.
        </main>
      }
    >
      <PersonalResult />
    </Suspense>
  );
}
