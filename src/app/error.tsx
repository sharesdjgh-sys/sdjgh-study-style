"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state">
      <h1>화면을 불러오지 못했어요.</h1>
      <p>잠시 후 다시 시도해 주세요. 저장된 답변으로 이어할 수 있어요.</p>
      <div className="button-row">
        <button className="button primary" onClick={reset}>
          다시 불러오기
        </button>
        <Link className="button secondary" href="/">
          홈으로
        </Link>
      </div>
    </main>
  );
}
