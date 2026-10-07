"use client";
import Image from "next/image";
import Link from "next/link";
import { useGoods } from "./goods-provider";
import { getGoods } from "@/lib/goods";
import { getMethod, type MethodId } from "@/lib/methods";
import { FAMILIES, type Modality } from "@/lib/content";
import { CHARACTERS } from "@/lib/characters";
export function Star({ size = 24 }: { size?: number }) {
  return (
    <Image
      src="/goods/star.webp"
      width={size}
      height={size}
      alt=""
      style={{ objectFit: "contain", verticalAlign: "middle" }}
    />
  );
}
export function StarWallet({ history = false }: { history?: boolean }) {
  const goods = useGoods();
  return (
    <section className="star-wallet" aria-label="나의 별과 굿즈">
      <div className="star-wallet-heading">
        <div>
          <span className="eyebrow">MY GOODS COLLECTION</span>
          <h2>작은 실천이, 소장하고 싶은 한 장으로.</h2>
        </div>
        <div className="star-balance">
          <Star size={38} />
          <strong>
            {!goods.loaded || goods.error ? "—" : goods.progress.balance}
          </strong>
          <span>별</span>
        </div>
      </div>
      <p>
        새 카드 개봉 <strong>1~2별</strong> · 스킬별 첫 10분 실천 + 설문{" "}
        <strong>1별</strong> · 유형별 4명 완성 <strong>3별</strong>
        <br />
        <small>
          각 카드·스킬·유형마다 최초 1회예요. 카드 보상은 랜덤이며 매일 반복
          지급되지 않아요.
        </small>
      </p>
      <div className="button-row">
        <Link className="button star-button" href="/goods">
          굿즈 둘러보기 · 일상 1별 / 특별 의상 2별
        </Link>
        <Link className="button secondary" href="/goods">
          내 굿즈 {goods.progress.owned.length}장 →
        </Link>
      </div>
      {goods.error && (
        <p role="status">
          별을 불러오지 못했어요.{" "}
          <button className="text-link" onClick={() => void goods.refresh()}>
            다시 확인
          </button>
        </p>
      )}
      {!goods.signedIn && (
        <p className="small muted">
          로그인하면 별과 교환한 굿즈를 계정에 보관해요.
        </p>
      )}
      {history && goods.signedIn && (
        <details className="heart-history">
          <summary>별 적립·사용 내역</summary>
          {goods.progress.entries.length ? (
            <ol>
              {goods.progress.entries.map((e) => (
                <li key={e.id}>
                  <span>
                    {e.reason === "card"
                      ? "카드 개봉 선물"
                      : e.reason === "practice"
                        ? "첫 실천 완료"
                        : e.reason === "family"
                          ? "유형 완성 선물"
                          : "굿즈 교환"}
                    <small>
                      {e.reason === "card"
                        ? CHARACTERS[e.reference]?.name
                        : e.reason === "goods"
                          ? `${getGoods(e.reference)?.name ?? ""} · ${getGoods(e.reference)?.title ?? ""}`
                          : e.reason === "practice"
                            ? getMethod(e.reference as MethodId)?.name
                            : FAMILIES[e.reference as Modality]?.label}
                    </small>
                    <small>
                      {new Date(e.createdAt).toLocaleString("ko-KR")}
                    </small>
                  </span>
                  <strong data-positive={e.amount > 0}>
                    {e.amount > 0 ? "+" : ""}
                    {e.amount}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p>아직 별 내역이 없어요.</p>
          )}
        </details>
      )}
    </section>
  );
}
