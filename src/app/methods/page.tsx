import Link from "next/link";
import { FAMILIES, MODALITIES } from "@/lib/content";
import { METHOD_IDS } from "@/lib/methods";
import { StudyArt } from "@/components/study-art";
import { Icon } from "@/components/icon";
import { BasicsNote } from "@/components/method-meta";
import { MethodCatalog } from "@/components/method-catalog";
export const metadata = { title: "공부법 도감" };
export default function Page() {
  return (
    <main id="main" className="catalog-shell">
      <div className="page-intro">
        <span className="eyebrow">공부법 도감 · {METHOD_IDS.length}가지</span>
        <h1>
          이름 있는 공부법,
          <br />
          <span className="accent-text">모두 모아 봤어요.</span>
        </h1>
        <p>
          공부캐마다 즐겨 쓰는 공부법이 달라요. 내 공부캐와 상관없이 모두 시도할
          수 있어요.
          <br />
          하나를 고르고, 떠올리고, 확인해 보세요.
        </p>
      </div>
      <BasicsNote />
      <MethodCatalog />
      <section
        className="catalog-group family-links"
        aria-labelledby="family-methods"
      >
        <h2 id="family-methods">방식별로 10분 실험하기</h2>
        <div className="method-catalog">
          {MODALITIES.map((m, i) => (
            <Link className="method-feature" href={`/methods/${m}`} key={m}>
              <StudyArt modality={m} compact />
              <div>
                <span className="eyebrow">
                  실험 0{i + 1} · {FAMILIES[m].verb}
                </span>
                <h2>{FAMILIES[m].label} 공부법 3가지</h2>
                <p>{FAMILIES[m].detail}</p>
                <span className="text-link">
                  과제별로 해 보기
                  <Icon name="arrow-right-linear" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="environment-note">
        <Icon name="checklist-minimalistic-linear" size={30} />
        <div>
          <h2>시작 전에, 딱 세 가지만.</h2>
          <p>
            알림을 잠시 끄고 · 필요한 자료를 준비하고 · 편한 자세를 찾아주세요.
          </p>
        </div>
      </div>
    </main>
  );
}
