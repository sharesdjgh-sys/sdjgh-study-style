import Link from "next/link";
import { notFound } from "next/navigation";
import { MODALITIES, FAMILIES, type Modality } from "@/lib/content";
import { METHOD_IDS, getMethod, isMethodId } from "@/lib/methods";
import { Mission } from "@/components/mission";
import { FamilyMission } from "@/components/family-mission";
import { MethodOwner } from "@/components/method-owner";
const isModality = (slug: string): slug is Modality =>
  MODALITIES.includes(slug as Modality);
/** /methods/visual처럼 방식이면 과제별 계열 공부법, /methods/cornell처럼 공부법 ID면 그 공부법 하나 */
export function generateStaticParams() {
  return [...MODALITIES, ...METHOD_IDS].map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isModality(slug)) return { title: `${FAMILIES[slug].label} 공부법` };
  if (isMethodId(slug)) return { title: getMethod(slug).name };
  return { title: "공부법" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isModality(slug) && !isMethodId(slug)) notFound();
  return (
    <main id="main" className="method-detail">
      <Link href="/methods" className="text-link">
        ← 공부 스킬북
      </Link>
      {isModality(slug) ? (
        <FamilyMission modality={slug} />
      ) : (
        <>
          <MethodOwner id={slug} />
          <Mission methodId={slug} />
        </>
      )}
    </main>
  );
}
