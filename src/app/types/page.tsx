import { TypeGallery } from "@/components/type-gallery";
import { MODALITIES, type Modality } from "@/lib/content";
export const metadata = { title: "16가지 스타일 도감" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  return (
    <main id="main" className="catalog-shell">
      <div className="page-intro">
        <span className="eyebrow">16가지 공부의 결</span>
        <h1>
          모두 다른 취향.
          <br />
          <span className="accent-text">모두 가능한 공부.</span>
        </h1>
        <p>
          내 스타일도, 친구의 스타일도 만나보세요.
          <br />
          하나의 유형이 공부의 가능성을 정하지는 않아요.
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
