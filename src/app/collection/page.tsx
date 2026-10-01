import { CollectionManager } from "@/components/collection-manager";
import { TypeGallery } from "@/components/type-gallery";
import { SpecialCollectionCard } from "@/components/special-collection-card";
export const metadata = {
  title: "나의 캐릭터 도감",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="main" className="catalog-shell">
      <div className="page-intro">
        <span className="eyebrow">나의 공부 친구들</span>
        <h1>
          한 명의 발견에서,
          <br />
          <span className="accent-text">열여섯 친구까지.</span>
        </h1>
        <p>
          첫 친구는 검사로, 다음 친구는 초대로.
          <br />
          같은 계정으로 로그인하면 어디서든 이어지는 나의 도감.
        </p>
      </div>
      <CollectionManager />
      <SpecialCollectionCard />
      <TypeGallery />
    </main>
  );
}
