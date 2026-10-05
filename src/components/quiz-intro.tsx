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
      <div className={styles.consentIntro}>
        <Image
          src="/ui-icons/nav-character.webp"
          alt=""
          width={80}
          height={80}
          priority
        />
        <span className="eyebrow">
          재미로 풀어보는 {QUESTIONS.length}개의 질문
        </span>
        <h1>
          시작 전에,
          <br />
          <span>잠깐만 읽어주세요.</span>
        </h1>
        <p>
          <strong>재미로 만나는, 나와 어울리는 공부캐!</strong>
          <br />
          다양한 공부법을 알아가고, 나에게 맞는 방법을 찾아봐요.
        </p>
      </div>
      <div className={styles.consentNotes}>
        <section>
          <h2>나와 친구의 공부 취향을 알아봐요</h2>
          <p>
            요즘 내가 선호하는 공부 모습을 <strong>16개 캐릭터</strong>에 빗대어
            보여드려요. 캐릭터를 만나며 익숙한 공부법도, 새로운 공부법도
            알아봐요.
          </p>
          <p>
            친구는 어떤 공부캐인지, 어떤 방식으로 공부하는 걸 좋아하는지 함께
            이야기해 보세요.{" "}
            <strong>누가 더 잘하는지 비교하는 점수는 아니에요.</strong>
          </p>
        </section>
        <section className={styles.consentCaution}>
          <h2>재미로 참고하고, 직접 시도해 보세요</h2>
          <p>
            <strong>
              공인된 심리·학습능력 검사가 아닌, 재미로 보는 콘텐츠예요.
            </strong>{" "}
            성격·능력을 진단하거나 성적을 예측하지 않아요.
          </p>
          <p>
            캐릭터에 맞는 공부법이라고 더 좋은 효과를 보장하지는 않아요. 과목과
            상황에 따라 달라질 수 있으니, 다른 캐릭터의 공부법도{" "}
            <strong>직접 해 보며 나에게 도움이 되는 방법</strong>을 찾아보세요.
          </p>
        </section>
        <section>
          <h2>요즘의 나를 떠올려 골라요</h2>
          <p>
            정답은 없어요. <strong>최근 2주 동안의 나</strong>를 떠올려 주세요.
          </p>
          <p>
            상황 질문에서는 가장 끌리는 방법 하나를, 두 문장 비교에서는 더
            가까운 쪽과 그 정도를 골라요.
          </p>
        </section>
        <section>
          <h2>기록과 캐릭터는 이렇게 보관해요</h2>
          <p>
            진행 중 답변은 이 브라우저에 <mark>최대 24시간</mark>, 완료 결과는{" "}
            <mark>7일</mark> 보관해요. 로그인하면 완료한 검사 답변·점수와 도감을
            계정에 저장해요.
          </p>
          <p>
            첫 캐릭터는 로그인 없이 만날 수 있어요.{" "}
            <strong>재검사에서는 새 캐릭터를 지급하지 않으며,</strong> 처음 만난
            캐릭터와 도감은 유지돼요.
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
          <span>
            <strong>서비스 취지와 주의사항</strong>을 읽고 이해했어요.
          </span>
        </label>
        <button className="button primary" type="submit" disabled={!agreed}>
          {resume ? "동의하고 이어하기" : "동의하고 검사 시작"}
        </button>
      </form>
    </main>
  );
}
