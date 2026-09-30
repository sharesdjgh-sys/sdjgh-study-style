"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FAMILIES, MODALITIES, type Modality } from "@/lib/content";
import { readSession, type Session } from "@/lib/storage";
import { StudyArt } from "./study-art";
import { Icon } from "./icon";
import { Arrow } from "./shell";
export function Home() {
  const [active, setActive] = useState<Modality>("visual");
  const [saved, setSaved] = useState<Session | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSaved(readSession()));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            나를 알아가는 작은 실험
          </div>
          <h1>
            남들 말고,
            <br />
            <span className="accent-text">나답게</span> 공부
            <span className="hero-period">.</span>
          </h1>
          <p className="hero-description">
            어떻게 공부할 때 가장 나다울까요?
            <br />
            16개의 질문으로 내 공부 취향을 발견하고,
            <br className="desktop-only" />
            오늘 시도할 새로운 방법을 찾아보세요.
          </p>
          <div className="hero-actions">
            <Link
              className="button primary large"
              href={saved?.result ? "/result" : "/quiz"}
            >
              {saved?.result
                ? "내 공부 스타일 다시 보기"
                : saved
                  ? "하던 테스트 이어하기"
                  : "내 공부 스타일 찾기"}
              <Arrow />
            </Link>
            <span className="micro-copy">
              <Icon name="clock-circle-linear" size={16} />약 3~5분{" "}
              <span>·</span> 가입 없이 바로 시작
            </span>
          </div>
          <div className="hero-bottom">
            <span className="small-stars">✳</span>
            <p>
              잘하는 방법도, 좋아하는 방법도.
              <br />
              <strong>나를 알아가면 시작이 달라져요.</strong>
            </p>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-grid" />
          <span className="floating-label">
            <Icon name="stars-linear" size={18} />
            당신의 공부 취향은?
          </span>
          <div className="deck-back" />
          <div className="hero-study-card">
            <div className="card-topline">
              <span>나의 공부 취향 카드</span>
              <span>0{MODALITIES.indexOf(active) + 1} / 04</span>
            </div>
            <StudyArt key={active} modality={active} />
            <div className="hero-card-caption">
              <span>{FAMILIES[active].title}</span>
              <h2>{FAMILIES[active].name}</h2>
              <div className="tag-row">
                {FAMILIES[active].tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <span className="round-stamp">
            다른 방법도
            <br />
            <strong>괜찮아요</strong>
            <Icon name="check-read-linear" size={22} />
          </span>
          <div className="deck-selector" aria-label="공부 스타일 미리보기">
            {MODALITIES.map((m) => (
              <button
                key={m}
                aria-pressed={active === m}
                className={active === m ? "selected" : ""}
                onClick={() => setActive(m)}
              >
                <Icon name={FAMILIES[m].icon} size={18} />
                {FAMILIES[m].verb}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="fact-strip" aria-label="검사 안내">
        <div>
          <strong>
            16<span>개의 질문</span>
          </strong>
          <p>정답 없이, 평소의 나답게</p>
        </div>
        <span className="strip-cross">+</span>
        <div>
          <strong>
            16<span>가지 스타일</span>
          </strong>
          <p>나의 공부 취향을 발견해요</p>
        </div>
        <span className="strip-cross">→</span>
        <div>
          <strong>
            10<span>분의 작은 시도</span>
          </strong>
          <p>결과를 오늘의 공부로 연결해요</p>
        </div>
        <Link href="/about">
          어떤 검사인가요?
          <Icon name="arrow-right-up-linear" size={18} />
        </Link>
      </section>
      <section className="discover-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">취향은 다르게, 가능성은 넓게</span>
            <h2>
              공부하는 모습도
              <br />
              이렇게 다양해요.
            </h2>
          </div>
          <p>
            그림으로, 말로, 손끝으로, 움직임으로.
            <br />
            내게 익숙한 방법부터 새로운 방법까지 만나보세요.
          </p>
        </div>
        <div className="family-grid">
          {MODALITIES.map((m, i) => (
            <Link
              className={`family-card family-${i}`}
              href={`/types?style=${m}`}
              key={m}
            >
              <div className="family-top">
                <span className="mono">0{i + 1}</span>
                <Icon name="arrow-right-up-linear" size={20} />
              </div>
              <Icon name={FAMILIES[m].icon} size={40} />
              <h3>{FAMILIES[m].verb} 정리해요</h3>
              <p>{FAMILIES[m].summary}</p>
              <span className="family-label">{FAMILIES[m].label}</span>
            </Link>
          ))}
        </div>
      </section>
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
              text: "최근 2주를 생각하며 16개의 질문에 답하세요. 더 좋은 답은 없어요.",
            },
            {
              title: "내 공부 취향을 발견해요",
              text: "나의 대표 스타일과 추천 이유를 확인하세요. 여러 방식이 비슷하게 나올 수도 있어요.",
            },
            {
              title: "오늘, 딱 10분만 해봐요",
              text: "추천 활동 하나를 골라 직접 시도하고, 내게 어땠는지 확인해 보세요.",
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
          <p className="eyebrow">어떤 스타일이든, 시작은 가볍게</p>
          <h2>
            나에게 맞는 한 가지를
            <br />
            찾아볼까요?
          </h2>
        </div>
        <Link className="button primary large" href="/quiz">
          내 스타일 발견하기
          <Arrow />
        </Link>
        <p className="closing-note">
          결과는 지금의 선호를 바탕으로 한 공부법 후보예요.
          <br />
          과목과 상황에 따라 다른 방법도 시도해 보세요.
        </p>
      </section>
    </main>
  );
}
