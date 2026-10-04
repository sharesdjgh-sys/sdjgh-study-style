"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QUESTIONS } from "@/lib/content";
import styles from "./quiz.module.css";

export function QuizIntro({
  resume,
  onAccept,
}: {
  resume: boolean;
  onAccept: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  return (
    <main id="main" className={`quiz-shell ${styles.page}`}>
      <Link className="text-link small" href="/">
        StudyCrew 홈
      </Link>
      <div className={styles.consentIntro}>
        <Image
          src="/ui-icons/nav-character.webp"
          alt=""
          width={80}
          height={80}
          priority
        />
        <span className="eyebrow">
          나를 알아가는 {QUESTIONS.length}개의 질문
        </span>
        <h1>
          시작 전에,
          <br />
          잠깐만 읽어주세요.
        </h1>
        <p>
          나의 공부 취향을 발견하고, 다양한 공부법을 시도해 보는 시간이에요.
        </p>
      </div>
      <div className={styles.consentNotes}>
        <section>
          <h2>나를 정해 놓는 검사가 아니에요</h2>
          <p>
            성격·능력을 진단하거나 성적을 예측하지 않아요. 결과는 지금의 취향을
            표현한 캐릭터예요. 다른 유형의 공부법도 자유롭게 시도해 보세요.
          </p>
        </section>
        <section>
          <h2>요즘의 나를 떠올려 골라요</h2>
          <p>
            정답은 없어요. 최근 2주 동안의 나를 떠올려 주세요. 상황 질문에서는
            가장 끌리는 방법 하나를, 두 문장 비교에서는 더 가까운 쪽과 그 정도를
            골라요.
          </p>
        </section>
        <section>
          <h2>기록과 캐릭터는 이렇게 보관해요</h2>
          <p>
            진행 중 답변은 이 브라우저에 최대 24시간, 완료 결과는 7일 보관해요.
            로그인하면 완료한 검사 답변·점수와 도감을 계정에 저장해요.
          </p>
          <p>
            첫 캐릭터는 로그인 없이 만날 수 있어요. 재검사에서는 새 캐릭터를
            지급하지 않으며, 처음 만난 캐릭터와 도감은 유지돼요.
          </p>
          <Link
            className="text-link"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            개인정보 안내 보기 ↗
          </Link>
        </section>
      </div>
      <form
        className={styles.consentForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (agreed) onAccept();
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          <span>서비스 취지와 주의사항을 읽고 이해했어요.</span>
        </label>
        <button className="button primary" type="submit" disabled={!agreed}>
          {resume ? "동의하고 이어하기" : "동의하고 검사 시작"}
        </button>
      </form>
    </main>
  );
}
