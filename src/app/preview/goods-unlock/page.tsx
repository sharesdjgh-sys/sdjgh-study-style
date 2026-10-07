import { notFound } from "next/navigation";
import { GoodsUnlockPreview } from "@/components/goods-unlock-preview";

export const metadata = {
  title: "굿즈 해금 연출 프리뷰",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <GoodsUnlockPreview />;
}
