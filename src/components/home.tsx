"use client";
import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
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
            <span className="hero-title-prefix">개성 만점</span> 16명 중,
            <br />
            너의 <span className="accent-text">공부캐</span>는?
          </h1>
          <div className="hero-description hero-teacher-guide">
            <div className="hero-teacher-avatar">
              <picture>
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet="/characters/motion/teacher-tori-guide-transparent-poster.webp"
                />
                <Image
                  src="/characters/motion/teacher-tori-guide-transparent.webp"
                  alt="손을 흔들며 공부캐 찾기를 안내하는 토리 선생님"
                  width={112}
                  height={112}
                  unoptimized
                  loading="eager"
                />
              </picture>
            </div>
            <div>
              <span>토리 선생님</span>
              <p>
                어떤 공부캐가 너와 닮았을까?
                <br />
                평소의 네 모습을 골라 함께 찾아보자!
              </p>
            </div>
          </div>
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
      <section className="journey-section" aria-labelledby="journey-title">
        <div className="journey-title">
          <span className="eyebrow quest-label">
            <Icon name="stars-linear" size={16} />
            공부캐와 함께하는 퀘스트
          </span>
          <h2 id="journey-title">
            카드는 <span className="quest-card-accent">차곡차곡,</span>
            <br />
            스킬은 <span className="quest-skill-accent">하나씩.</span>
          </h2>
          <Link href="/methods" className="text-link">
            공부 스킬북 펼치기
            <Icon name="arrow-right-linear" size={20} />
          </Link>
        </div>
        <ol className="journey-list">
          {[
            {
              icon: "quest-collect",
              title: "공부캐 카드로 도감 채우기",
              text: "테스트로 나를 닮은 첫 공부캐를 만나요. 친구와 함께 다른 공부캐 카드도 모으며 나만의 도감을 채워 봐요.",
            },
            {
              icon: "quest-explore",
              title: "궁금한 공부캐의 스킬 알아보기",
              text: "이 공부캐는 어떻게 외우고, 문제를 풀까? 스킬북에서 다양한 공부 스킬과 쓰는 방법을 하나씩 알아봐요.",
            },
            {
              icon: "quest-practice",
              title: "마음에 드는 스킬, 내 공부에 써 보기",
              text: "오늘 할 공부에 스킬 하나를 골라 10분만 써 봐요. 모은 카드와 상관없이 모든 스킬을 자유롭게 연습할 수 있어요.",
            },
          ].map((item, i) => (
            <li key={item.title}>
              <span className="quest-step">
                <Image
                  src={`/ui-icons/${item.icon}.webp`}
                  alt=""
                  width={52}
                  height={52}
                  className="quest-step-icon"
                />
                <span>0{i + 1}</span>
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section
        className="closing-cta closing-reveal"
        aria-labelledby="closing-title"
      >
        <div className="closing-copy">
          <p className="eyebrow">16명의 공부캐 · 너를 닮은 한 명</p>
          <h2 id="closing-title">
            내가 공부캐라면,
            <br />
            <span>어떤 친구일까?</span>
          </h2>
          <p className="closing-description">
            계획표부터 짜는 너도, 일단 시작하는 너도.
            <br />
            평소의 너를 고르면, 닮은 공부캐가 나타나요.
          </p>
        </div>
        <div className="closing-card-art">
          <MysteryCarousel silhouetteOnly />
        </div>
        <div className="closing-actions">
          <Link
            className="button primary large"
            href={saved?.result ? "/result" : "/quiz"}
          >
            {saved?.result
              ? "내 공부캐 카드 다시 보기"
              : saved
                ? "이어서 내 공부캐 만나기"
                : "내 공부캐 카드 만나기"}
            <Arrow />
          </Link>
          <p className="closing-time">
            <Icon name="clock-circle-linear" size={15} />약 3~5분 · 가입 없이
            바로 시작
          </p>
          <p className="closing-note">
            카드로 만나는 나의 공부 습관, 스킬북으로 넓어지는 공부 방법.
          </p>
        </div>
      </section>
    </main>
  );
}
