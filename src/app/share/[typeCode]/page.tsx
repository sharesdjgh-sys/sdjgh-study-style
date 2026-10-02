import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { SharedCharacter } from "@/components/shared-character";
import { shareImagePath } from "@/lib/share-image";

// This page reads searchParams and renders per request. Listing static params
// needlessly triggers Next's concurrent dev prerender-manifest read/write path.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeCode: string }>;
}): Promise<Metadata> {
  const type = getType((await params).typeCode);
  if (!type) return {};
  return {
    title: `${CHARACTERS[type.code].name} · 친구의 공부캐`,
    description:
      "너 무슨 공부캐 나왔어? 재미로 즐기고 다양한 공부법을 발견해요.",
    robots: { index: false, follow: false },
    openGraph: {
      title: `내 공부캐는 ${CHARACTERS[type.code].name}! 너는 누구야?`,
      description:
        "재미로 만나는 공부 캐릭터! 다양한 공부 스타일과 공부법을 발견해요.",
      images: [{ url: shareImagePath(type.code), width: 1200, height: 630 }],
    },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ typeCode: string }>;
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const type = getType((await params).typeCode);
  if (!type) notFound();
  const ref = (await searchParams).ref;
  const referralCode =
    typeof ref === "string" && /^[A-Fa-f0-9]{10}$/.test(ref)
      ? ref.toUpperCase()
      : undefined;
  return <SharedCharacter type={type} referralCode={referralCode} />;
}
