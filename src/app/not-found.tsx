import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <span className="eyebrow">길을 조금 벗어났네요</span>
      <h1>이 페이지를 찾지 못했어요.</h1>
      <p>주소를 다시 확인하거나, 새로운 공부 취향을 찾아보세요.</p>
      <Link href="/" className="button primary">
        공부캐 홈으로
      </Link>
    </main>
  );
}
