import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getType } from "@/lib/content";
import { TypeAccess } from "@/components/type-access";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeCode: string }>;
}): Promise<Metadata> {
  const { typeCode } = await params;
  const t = getType(typeCode);
  if (!t) return {};
  return {
    title: "아직은 비밀인 공부 친구",
    description: "16개의 실루엣 중, 나와 닮은 공부 친구를 만나보세요.",
    robots: { index: false, follow: true },
    openGraph: {
      title: "내 공부 친구는 누구일까요?",
      description: "검사를 마치면 나만의 캐릭터가 모습을 드러내요.",
      images: [{ url: "/api/og", width: 1200, height: 630 }],
    },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ typeCode: string }>;
  searchParams: Promise<{ from?: string; ref?: string | string[] }>;
}) {
  const { typeCode } = await params;
  const type = getType(typeCode);
  if (!type) notFound();
  // Preserve previously copied links without opening the public catalog.
  const query = await searchParams;
  if (query.from === "share") {
    const ref =
      typeof query.ref === "string" && /^[A-Fa-f0-9]{10}$/.test(query.ref)
        ? `&ref=${query.ref.toUpperCase()}`
        : "";
    redirect(`/share/${type.code}?from=share${ref}`);
  }
  return <TypeAccess type={type} />;
}
