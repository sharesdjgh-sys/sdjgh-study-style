import { CollectionManager } from "@/components/collection-manager";
import { CollectionInvitation } from "@/components/collection-invitation";
import styles from "./page.module.css";
export const metadata = {
  title: "나의 캐릭터 도감",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="main" className="catalog-shell character-catalog">
      <CollectionInvitation />
      <div id="collection-notebook" className={styles.notebook}>
        <CollectionManager />
      </div>
    </main>
  );
}
