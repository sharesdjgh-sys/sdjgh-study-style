import Link from "next/link";
import Image from "next/image";
import { CharacterMotion } from "@/components/character-motion";
import { FAMILIES, MODALITIES } from "@/lib/content";
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
        className={`catalog-group family-links ${styles.experiments}`}
        aria-labelledby="family-methods"
      >
        <div className={styles.experimentHeading}>
          <div>
            <span className={styles.experimentEyebrow}>
              오늘은 다른 방식으로
            </span>
            <h2 id="family-methods">
              방식별로 <span>10분 실험하기</span>
            </h2>
          </div>
          <p>
            내 유형에 얽매이지 않고,
            <br />
            지금 해 보고 싶은 방법을 골라요.
          </p>
        </div>
        <div className={styles.experimentGrid}>
          {MODALITIES.map((m, i) => (
            <Link
              className={styles.experimentCard}
              data-family={m}
              href={`/methods/${m}`}
              key={m}
            >
              <div className={styles.experimentTop}>
                <span className={styles.experimentFamily}>
                  <Icon name={FAMILIES[m].icon} size={20} />
                  {FAMILIES[m].label} · {FAMILIES[m].verb}
                </span>
                <span className={styles.experimentNumber}>0{i + 1}</span>
              </div>
              <div className={styles.experimentBody}>
                <div className={styles.experimentArt} aria-hidden="true">
                  <Image
                    src={`/study-methods/${{ visual: "flowchart", auditory: "feynman", tactile: "card-sort", motion: "spaced-retry" }[m]}.webp`}
                    alt=""
                    width={96}
                    height={96}
                    sizes="(max-width: 767px) 72px, 96px"
                  />
                </div>
                <div>
                  <h3>{FAMILIES[m].activity}</h3>
                  <p>{FAMILIES[m].detail}</p>
                </div>
              </div>
              <div className={styles.experimentFooter}>
                <span>
                  공부법 <b>3가지</b> · <b>10분</b> 실험
                </span>
                <span className={styles.experimentGo}>
                  과제별로 해 보기 <Icon name="arrow-right-linear" size={18} />
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
