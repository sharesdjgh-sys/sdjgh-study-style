import Link from "next/link";
import { notFound } from "next/navigation";
import { MODALITIES, FAMILIES, type Modality } from "@/lib/content";
import { Mission } from "@/components/mission";
export function generateStaticParams() {
  return MODALITIES.map((modality) => ({ modality }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ modality: string }>;
}) {
  const { modality } = await params;
  return { title: FAMILIES[modality as Modality]?.activity ?? "공부법" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ modality: string }>;
}) {
  const { modality } = await params;
  if (!MODALITIES.includes(modality as Modality)) notFound();
  return (
    <main id="main" className="method-detail">
      <Link href="/methods" className="text-link">
        ← 공부법 실험실
      </Link>
      <Mission modality={modality as Modality} />
    </main>
  );
}
