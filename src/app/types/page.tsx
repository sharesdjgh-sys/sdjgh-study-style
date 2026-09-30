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
          나와 닮은 친구,
          <br />
          <span className="accent-text">누구일까요?</span>
        </h1>
        <p>
          16명의 공부 친구들이 실루엣 뒤에 숨어 있어요.
          <br />
          검사로 내 친구를 만나고, 다른 친구의 정체는 서로 물어봐요.
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
