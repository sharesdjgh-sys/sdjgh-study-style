import type { Metadata } from "next";
import { DiscoveryPreview } from "@/components/discovery-preview";

export const metadata: Metadata = {
  title: "캐릭터 등장 미리보기",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DiscoveryPreview />;
}
