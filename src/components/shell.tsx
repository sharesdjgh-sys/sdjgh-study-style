import Link from "next/link";
import { Icon } from "./icon";
export function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/" aria-label="공부결 홈">
        <span className="brand-mark">
          <span />
          <span />
          <span />
          <span />
        </span>
        공부결<span className="brand-caption">나다운 공부의 시작</span>
      </Link>
      <nav aria-label="주요 메뉴">
        <Link href="/types">스타일 도감</Link>
        <Link href="/methods">공부법 실험실</Link>
        <Link href="/quiz" className="nav-start">
          테스트 시작 <Icon name="arrow-right-up-linear" size={17} />
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link href="/" className="brand">
          공부결<span className="footer-dot">.</span>
        </Link>
        <p>공부에도, 나만의 결이 있으니까.</p>
      </div>
      <nav aria-label="서비스 안내">
        <Link href="/collection">내 도감 · 로그인</Link>
        <Link href="/about">검사와 학교 활용 안내</Link>
        <Link href="/privacy">저장 및 개인정보 안내</Link>
      </nav>
      <span className="footer-year">© 2026 공부결</span>
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
