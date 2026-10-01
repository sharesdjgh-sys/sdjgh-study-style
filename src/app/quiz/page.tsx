import type { Metadata } from "next";
import { Quiz } from "@/components/quiz";
export const metadata: Metadata = {
  title: "내 공부캐 찾기",
  robots: { index: false, follow: true },
};
export default function Page() {
  return <Quiz />;
}
