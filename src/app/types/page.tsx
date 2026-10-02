import { TypeGallery } from "@/components/type-gallery";
import { MODALITIES, type Modality } from "@/lib/content";
export const metadata = { title: "16명의 공부캐 도감" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  return (
    <main id="main" className="catalog-shell">
      <div className="page-intro">
        <span className="eyebrow">
          귀여운 공부캐 16명, 서로 다른 공부 스타일
        </span>
        <h1>
          나와 닮은 친구,
          <br />
          <span className="accent-text">누구일까요?</span>
        </h1>
        <p>
          그림으로, 말로, 손으로, 움직이며! 공부하는 모습도 다양해요.
          <br />
          테스트로 내 공부캐를 만나고, 다른 캐릭터의 공부법도 탐색해 보세요.
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
