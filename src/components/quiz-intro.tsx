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
        <section
          className={styles.keepsakeNote}
          aria-labelledby="keepsake-title"
        >
          <div className={styles.keepsakeHeading}>
            <div>
              <span className={styles.keepsakeEyebrow}>
                오늘 만난 친구, 다음에도 함께
              </span>
              <h2 id="keepsake-title">
                처음 만난 공부캐,
                <br />
                <span>내 도감에 쏙!</span>
              </h2>
            </div>
            <Image
              src="/ui-icons/nav-collection.webp"
              width={88}
              height={88}
              alt=""
            />
          </div>
          <p className={styles.keepsakeLead}>
            처음 만난 친구를 오래 간직하고 싶다면,{" "}
            <span className={styles.keepsakeKakao}>
              <Image src="/kakaotalk-icon.png" width={22} height={22} alt="" />
              <strong>카톡으로</strong>
            </span>{" "}
            로그인하고 도감에 담아 주세요.
          </p>
          <p>
            내 검사 기록과 도감에 모은 친구들은 계정에 남아요. 다른 기기로
            찾아와도 같은 카카오 계정이면 다시 만날 수 있어요.
          </p>
          <details className={styles.keepsakeGuest}>
            <summary>로그인 없이 먼저 만나봐도 괜찮아요</summary>
            <p>
              첫 검사와 결과 확인은 로그인 없이도 할 수 있어요. 진행 중 답변은{" "}
              <strong>최대 24시간</strong>, 완료 결과는 <strong>7일</strong>{" "}
              동안 이 브라우저에만 남아요. 다른 기기로 이어지지 않고, 브라우저
              기록을 지우면 사라질 수 있어요.
            </p>
          </details>
          <p className={styles.keepsakeRetake}>
            다시 검사해도 첫 친구는 그대로예요. 재검사로 새 캐릭터가 추가되지는
            않아요.
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
