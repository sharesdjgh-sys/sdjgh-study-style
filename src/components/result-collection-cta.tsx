"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./auth-provider";
import { useCollection } from "./collection-provider";
import styles from "./onboarding.module.css";

export function ResultCollectionCta() {
  const auth = useAuth();
  const { data } = useCollection();
  if (auth.session.signedIn && data.firstType) return null;
  return (
    <section
      className={styles.collectionCta}
      aria-labelledby="keep-character-title"
    >
      <Image src="/ui-icons/nav-character.webp" width={64} height={64} alt="" />
      <div>
        <p className={styles.eyebrow}>처음 만난 공부 친구, 오래오래</p>
        <h2 id="keep-character-title">내 공부캐를 도감에 간직해요</h2>
        <p>
          {auth.session.signedIn
            ? "검사 기록은 계정에 보관돼요. 이제 첫 친구를 도감에 저장하고 수집을 시작해요."
            : "지금 결과는 이 브라우저에 7일간 남아요. 카카오 로그인 후 도감에 저장하면 다른 기기에서도 다시 만날 수 있어요."}
        </p>
        <p className={styles.note}>
          첫 도감 저장 선물: 하트 1~3개 · 별 1~2개 · 내 친구의 시그니처 스킬
        </p>
        {auth.session.signedIn ? (
          <Link className="button primary" href="/collection">
            첫 캐릭터 도감에 저장하기 →
          </Link>
        ) : (
          <button
            type="button"
            className={`button ${styles.kakao}`}
            disabled={auth.busy || !auth.session.configured}
            onClick={() => void auth.login("/collection")}
          >
            <Image src="/kakao-symbol.svg" width={20} height={20} alt="" />
            카카오로 내 공부캐 간직하기
          </button>
        )}
        {!auth.session.signedIn && (
          <p className={styles.note}>
            로그인 후 ‘첫 캐릭터 도감에 저장하기’를 눌러 주세요.
          </p>
        )}
        {!auth.session.signedIn && !auth.session.configured && (
          <p className={styles.note}>카카오 로그인을 준비 중이에요.</p>
        )}
        {auth.message && <p role="status">{auth.message}</p>}
      </div>
    </section>
  );
}
