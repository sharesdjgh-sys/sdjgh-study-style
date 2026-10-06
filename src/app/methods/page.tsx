import Link from "next/link";
import Image from "next/image";
import { CharacterMotion } from "@/components/character-motion";
import { FAMILIES, MODALITIES } from "@/lib/content";
import { StudyArt } from "@/components/study-art";
import { Icon } from "@/components/icon";
import { BasicsNote } from "@/components/method-meta";
import { MethodCatalog } from "@/components/method-catalog";
import styles from "./skillbook.module.css";
export const metadata = { title: "공부 스킬북" };
export default function Page() {
  return (
    <main id="main" className={`catalog-shell ${styles.page}`}>
      <section
        className="page-intro methods-intro"
        aria-labelledby="methods-title"
      >
        <header className="methods-page-heading">
          <span className="methods-heading-icon" aria-hidden="true">
            <Image
              src="/ui-icons/nav-skills.webp"
              width={44}
              height={44}
              alt=""
            />
          </span>
          <div>
            <h1 id="methods-title">
              공부 <span className="skill-spectrum">스킬북</span>
            </h1>
            <p className="methods-page-description">
              나에게 맞는 공부 스킬, 하나씩 익혀 볼까요?
            </p>
          </div>
        </header>
        <div className="methods-welcome">
          <h2 className="methods-intro-invitation">
            공부가 막힐 땐,
            <br className="methods-invitation-break" />{" "}
            <span className="accent-text">방법을 바꿔 볼까?</span>
          </h2>
          <div className="methods-teacher-scene">
            <div className="methods-teacher-portrait">
              <CharacterMotion
                asset={{
                  video: "/characters/motion/teacher-tori-part-2-8s-v1.mp4",
                  poster: "/characters/motion/teacher-tori-welcome-poster.webp",
                  background: "#e3ecdb",
                }}
                name="토리 선생님"
                species="곰"
                imageAlt="손을 흔들며 공부법을 안내하는 토리 선생님"
                active
                priority
              />
            </div>
          </div>
          <p className="methods-teacher-label">토리 선생님</p>
          <p className="methods-intro-message">
            마음에 드는 방법 하나, <strong>오늘 10분만 해 보자.</strong>
          </p>
        </div>
      </section>
      <BasicsNote />
      <MethodCatalog />
      <section
        className="catalog-group family-links"
        aria-labelledby="family-methods"
      >
        <h2 id="family-methods">방식별로 10분 실험하기</h2>
        <div className="method-catalog">
          {MODALITIES.map((m, i) => (
            <Link
              className="method-feature"
              data-family={m}
              href={`/methods/${m}`}
              key={m}
            >
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
