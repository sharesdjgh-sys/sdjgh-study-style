import type { Metadata } from "next";
import { PersonalResult } from "@/components/result";
export const metadata: Metadata = {
  title: "나의 공부캐와 공부 스타일",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PersonalResult />;
}
