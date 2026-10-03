import Link from "next/link";
import { Icon } from "./icon";
import { CollectionLink } from "./collection-link";
export function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/" aria-label="공부캐 홈">
        <span className="brand-mark">
          <span />
          <span />
          <span />
          <span />
        </span>
        공부캐<span className="brand-caption">공부할 때, 또 다른 나</span>
      </Link>
      <nav aria-label="주요 메뉴">
        <Link href="/types">공부캐 도감</Link>
        <Link href="/methods">공부법 도감</Link>
        <Link href="/quiz" className="nav-start">
          내 캐 찾기 <Icon name="arrow-right-up-linear" size={17} />
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
          공부캐<span className="footer-dot">.</span>
        </Link>
        <p>재미로 만나는 공부캐, 다양하게 즐기는 공부법.</p>
      </div>
      <nav aria-label="서비스 안내">
        <CollectionLink />
        <Link href="/methods">공부법 도감</Link>
        <Link href="/about">테스트와 학교 활용 안내</Link>
        <Link href="/privacy">저장 및 개인정보 안내</Link>
      </nav>
      <span className="footer-year">© 2026 공부캐</span>
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
