import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { STUDY_TYPES, getType } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
import { SharedCharacter } from "@/components/shared-character";

export function generateStaticParams() {
  return STUDY_TYPES.map((type) => ({ typeCode: type.code }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeCode: string }>;
}): Promise<Metadata> {
  const type = getType((await params).typeCode);
  if (!type) return {};
  return {
    title: `${CHARACTERS[type.code].name} · 친구의 공부 캐릭터`,
    description: "넌 어떤 캐릭터 나왔어? 나와 닮은 공부 친구를 만나보세요.",
    robots: { index: false, follow: false },
    openGraph: {
      title: `내 공부 친구는 ${CHARACTERS[type.code].name}! 넌 누구야?`,
      description: type.subtitle,
      images: [{ url: `/api/og?type=${type.code}`, width: 1200, height: 630 }],
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
