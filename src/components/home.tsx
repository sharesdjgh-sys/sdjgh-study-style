"use client";
import { Fragment } from "react";
import Link from "next/link";
import {
  FAMILIES,
  MODALITIES,
  PACE_LABELS,
  QUESTIONS,
  SOCIAL_LABELS,
  STUDY_TYPES,
  getType,
} from "@/lib/content";
import { CharacterCard } from "./character-card";
import { MysteryCarousel } from "./mystery-carousel";
import { MethodPreview } from "./method-preview";
import { useSavedSession } from "./use-saved-session";
import { Icon } from "./icon";
import { Arrow } from "./shell";
import { useCollection } from "./collection-provider";
import { CollectionLink } from "./collection-link";
import { collectionProgress } from "@/lib/collection-progress";
type FormulaChip = { label: string; icon: string; family?: string };
const FORMULA_FACTORS: {
  key: string;
  title: string;
  chips: FormulaChip[];
}[] = [
  {
    key: "modality",
    title: "어떻게 정리해요?",
    chips: MODALITIES.map((m) => ({
      label: FAMILIES[m].verb,
      icon: FAMILIES[m].icon,
      family: m,
    })),
  },
  {
    key: "social",
    title: "누구와 해요?",
    chips: [
      { label: SOCIAL_LABELS.solo, icon: "user-rounded-linear" },
      { label: SOCIAL_LABELS.team, icon: "users-group-rounded-linear" },
    ],
  },
  {
    key: "pace",
    title: "어떻게 계획해요?",
    chips: [
      { label: PACE_LABELS.planned, icon: "checklist-minimalistic-linear" },
      { label: PACE_LABELS.flexible, icon: "stars-linear" },
    ],
  },
];
export function Home() {
  const { session: saved, first } = useSavedSession();
  const { data, loaded: accountLoaded } = useCollection();
  const ownCode = collectionProgress(data, first?.result).firstCode;
  const ownType = accountLoaded && ownCode ? getType(ownCode) : null;
  return (
    <main id="main">
      <section className="hero game-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            재미로 만나는 귀여운 공부 캐릭터
          </div>
          <h1>
            16명 중,
            <br />
            너의 <span className="accent-text">공부캐</span>는?
          </h1>
          <p className="hero-description">
            공부할 때 나타나는 또 다른 나.
            <br />
            평소의 내 모습을 편하게 고르다 보면,
            <br className="desktop-only" />
            나를 꼭 닮은 동물 친구를 만날 수 있어요.
          </p>
          <div className="hero-actions">
            <Link
              className="button primary large"
              href={saved?.result ? "/result" : "/quiz"}
            >
              {saved?.result
                ? "내 공부캐 다시 보기"
                : saved
                  ? "하던 테스트 이어하기"
                  : "내 공부캐 찾기"}
              <Arrow />
            </Link>
            <span className="micro-copy">
              <Icon name="clock-circle-linear" size={16} />약 3~5분{" "}
              <span>·</span> 가입 없이 바로 시작
            </span>
          </div>
          <aside className="test-purpose">
            <Icon name="stars-linear" size={20} />
            <p>
              <strong>재미로 하는 테스트, 공부법은 다양하게!</strong>
              <br />
              성격·능력을 진단하지 않아요. 어떤 캐릭터가 나와도 모든 공부법을
              자유롭게 시도해 보세요.
            </p>
          </aside>
          <CollectionLink className="home-collection-link" />
        </div>
        <div className="hero-visual hero-character-visual">
          <div className="hero-card-counter" aria-hidden="true">
            <span>나의 첫 캐릭터</span>
            <strong>{ownType ? "발견 완료!" : "??? / 16"}</strong>
          </div>
          <div className="hero-card-back hero-card-back-one" aria-hidden="true">
            <span>✦</span>
          </div>
          <div className="hero-card-back hero-card-back-two" aria-hidden="true">
            <span>✦</span>
          </div>
          <span className="floating-label">
            <Icon name="stars-linear" size={18} />
            {ownType
              ? "나의 첫 공부캐를 만났어요"
              : "아직은 비밀! 어떤 귀요미가 나올까?"}
          </span>
          {ownType ? (
            <div className="hero-character-card">
              <CharacterCard type={ownType} detailLink priority />
            </div>
          ) : (
            <MysteryCarousel />
          )}
        </div>
      </section>
      <section className="type-formula" aria-labelledby="type-formula-title">
        <div className="type-formula-head">
          <div>
            <h2 id="type-formula-title">
              {STUDY_TYPES.length}명의 공부캐는 이렇게 나뉘어요
            </h2>
            <p>
              {QUESTIONS.length}문항으로 세 가지를 살펴봐요. 정답은 없으니
              요즘의 나와 가까운 쪽을 고르면 돼요.
            </p>
          </div>
          <Link href="/about" className="text-link">
            테스트 방식 자세히 보기
            <Icon name="arrow-right-up-linear" size={18} />
          </Link>
        </div>
        <div className="type-formula-grid">
          {FORMULA_FACTORS.map((factor, i) => (
            <Fragment key={factor.key}>
              {i > 0 && (
                <span className="formula-op" aria-hidden="true">
                  ×
                </span>
              )}
              <div className={`formula-factor formula-${factor.key}`}>
                <h3>
                  <span className="mono">0{i + 1}</span>
                  {factor.title}
                </h3>
                <strong className="formula-count">
                  {factor.chips.length}
                  <span>가지</span>
                </strong>
                <ul>
                  {factor.chips.map((chip) => (
                    <li key={chip.label} data-family={chip.family}>
                      <Icon name={chip.icon} size={16} />
                      {chip.label}
                    </li>
                  ))}
                </ul>
              </div>
            </Fragment>
          ))}
          <span className="formula-op" aria-hidden="true">
            =
          </span>
          <div className="formula-result">
            <span className="formula-spark" aria-hidden="true">
              ✦
            </span>
            <strong className="formula-count">
              {STUDY_TYPES.length}
              <span>가지 조합</span>
            </strong>
            <p>조합마다 공부캐가 한 명씩 있어요</p>
          </div>
        </div>
      </section>
      <MethodPreview />
      <section className="journey-section">
        <div className="journey-title">
          <span className="eyebrow">발견에서 시도까지</span>
          <h2>
            결과를 읽고 나면,
            <br />
            한번 해보는 거예요.
          </h2>
          <Link href="/methods" className="text-link">
            공부법 실험실 둘러보기
            <Icon name="arrow-right-linear" size={20} />
          </Link>
        </div>
        <ol className="journey-list">
          {[
            {
              title: "평소의 나를 떠올려요",
              text: "최근 2주의 공부 모습을 떠올리며 내 속도로 골라 보세요. 더 좋은 답은 없어요.",
            },
            {
              title: "나를 닮은 공부캐를 만나요",
              text: "캐릭터의 이야기에 공감해 보고 친구와 비교해요. 딱 맞지 않는 부분이 있어도 괜찮아요.",
            },
            {
              title: "오늘, 딱 10분만 해봐요",
              text: "내 캐릭터의 방법도, 다른 캐릭터의 방법도! 하나를 골라 시도하고 내게 어땠는지 살펴봐요.",
            },
          ].map((item, i) => (
            <li key={item.title}>
              <span>0{i + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="closing-cta">
        <span className="closing-symbol">✳</span>
        <div>
          <p className="eyebrow">친구에게도 물어봐요. 너 무슨 캐 나왔어?</p>
          <h2>
            공부할 때의 나는,
            <br />
            어떤 귀여운 친구일까?
          </h2>
        </div>
        <Link className="button primary large" href="/quiz">
          내 공부캐 찾기
          <Arrow />
        </Link>
        <p className="closing-note">
          재미로 만나고, 새로운 공부법도 발견해요.
          <br />
          캐릭터 하나가 나의 공부 가능성을 정하지 않아요.
        </p>
      </section>
    </main>
  );
}
