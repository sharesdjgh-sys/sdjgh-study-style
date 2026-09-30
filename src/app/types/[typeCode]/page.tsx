import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { STUDY_TYPES, getType } from "@/lib/content";
import { TypeResult } from "@/components/result";
export function generateStaticParams() {
  return STUDY_TYPES.map((t) => ({ typeCode: t.code }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeCode: string }>;
}): Promise<Metadata> {
  const { typeCode } = await params;
  const t = getType(typeCode);
  if (!t) return {};
  return {
    title: t.name,
    description: t.subtitle,
    openGraph: {
      title: `나의 공부 취향은 ${t.name}`,
      description: t.subtitle,
      images: [{ url: `/api/og?type=${t.code}`, width: 1200, height: 630 }],
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ typeCode: string }>;
}) {
  const { typeCode } = await params;
  const type = getType(typeCode);
  if (!type) notFound();
  return <TypeResult type={type} />;
}
