import { TypeGallery } from "@/components/type-gallery";
import { CatalogHeading } from "@/components/catalog-heading";
import Image from "next/image";
import { MODALITIES, type Modality } from "@/lib/content";
export const metadata = { title: "공부캐 도감" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  return (
    <main id="main" className="catalog-shell character-catalog">
      <div className="page-intro catalog-intro">
        <div className="catalog-kicker">
          <Image
            src="/ui-icons/nav-collection.webp"
            alt=""
            width={60}
            height={60}
          />
          <span>
            공부캐 도감 <small>4가지 공부 스타일</small>
          </span>
        </div>
        <CatalogHeading />
        <p>
          <strong>나를 닮은 첫 친구</strong>를 발견하고,
          <br />한 장씩 <strong>나만의 도감</strong>을 채워봐요.
        </p>
      </div>
      <TypeGallery
        initial={
          MODALITIES.includes(style as Modality) ? (style as Modality) : "all"
        }
      />
    </main>
  );
}
