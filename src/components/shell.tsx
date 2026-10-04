import Link from "next/link";
import Image from "next/image";
import { Icon } from "./icon";
import styles from "./footer.module.css";
import { HeaderAccount } from "./header-account";
export function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/" aria-label="StudyCrew 홈">
        <Image
          className="brand-card-mark"
          src="/brand/study-friends-v2-192.png"
          alt=""
          width={192}
          height={192}
          sizes="(max-width: 360px) 52px, (max-width: 380px) 60px, (max-width: 480px) 68px, 64px"
          priority
        />
        <Image
          className="brand-wordmark"
          src="/brand/studycrew-wordmark-book.webp"
          alt="StudyCrew"
          width={900}
          height={245}
          sizes="(max-width: 360px) 144px, (max-width: 380px) 160px, 176px"
          priority
        />
        <span className="brand-caption">공부할 때, 또 다른 나</span>
      </Link>
      <nav aria-label="주요 메뉴">
        <Link href="/types">공부캐 도감</Link>
        <Link href="/methods">공부 스킬북</Link>
        <Link href="/account" className="header-my-account">
          <Image
            src="/ui-icons/nav-account.webp"
            alt=""
            width={28}
            height={28}
          />
          내 정보
        </Link>
        <HeaderAccount />
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className={`site-footer ${styles.footer}`}>
      <div className={styles.main}>
        <div className={styles.intro}>
          <Image
            src="/brand/lifeprofessor-logo.png"
            alt="인생교수의 AI 연구소"
            width={399}
            height={67}
            sizes="210px"
            className={styles.logo}
          />
          <p>공부캐를 모으고, 공부 스킬을 넓혀요.</p>
        </div>
        <nav className={styles.navigation} aria-label="푸터 메뉴">
          <Link href="/collection">내 도감</Link>
          <Link href="/account">내 정보</Link>
          <Link href="/methods">공부 스킬북</Link>
          <Link href="/about">서비스 안내</Link>
          <Link href="/privacy" className={styles.privacy}>
            개인정보 안내
          </Link>
        </nav>
      </div>
      <p className={styles.copyright}>
        Copyright © 2026 인생교수의 AI 연구소. All rights reserved.
      </p>
    </footer>
  );
}
export function Arrow({ direction = "right" }: { direction?: "right" | "up" }) {
  return (
    <span className="button-arrow">
      <Icon
        name={
          direction === "up" ? "arrow-right-up-linear" : "arrow-right-linear"
        }
        size={20}
      />
    </span>
  );
}
