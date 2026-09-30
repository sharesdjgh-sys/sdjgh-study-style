import Link from "next/link";
import { FAMILIES, MODALITIES } from "@/lib/content";
import { StudyArt } from "@/components/study-art";
import { Icon } from "@/components/icon";
export const metadata = { title: "공부법 실험실" };
export default function Page() {
  return (
    <main id="main" className="catalog-shell">
      <div className="page-intro">
        <span className="eyebrow">오늘의 10분 실험</span>
        <h1>
          읽고 끝내기엔,
          <br />
          <span className="accent-text">내 가능성이 아까우니까.</span>
        </h1>
        <p>
          검사 없이도 모든 공부법을 시도할 수 있어요.
          <br />
          하나를 고르고, 떠올리고, 확인해 보세요.
        </p>
      </div>
      <div className="method-catalog">
        {MODALITIES.map((m, i) => (
          <Link className="method-feature" href={`/methods/${m}`} key={m}>
            <StudyArt modality={m} compact />
            <div>
              <span className="eyebrow">실험 0{i + 1} · 10분</span>
              <h2>{FAMILIES[m].activity}</h2>
              <p>{FAMILIES[m].detail}</p>
              <span className="text-link">
                활동 살펴보기
                <Icon name="arrow-right-linear" />
              </span>
            </div>
          </Link>
        ))}
      </div>
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
