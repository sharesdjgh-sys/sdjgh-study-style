import { formatSdjPrizeNumber } from "@/lib/sdj-prize-number";
import Image from "next/image";
import Link from "next/link";
import { getGoods } from "@/lib/goods";
import voucher from "../../events/sdj/nav-voucher.webp";
import styles from "./ledger.module.css";

export type PrizeRow = {
  number: number;
  design: string;
  kind: string;
  vouchers: number;
  issued_at: string | null;
  paid_at: string | null;
};
const labels: Record<string, string> = {
  daily: "일상 포토카드",
  special: "특별 의상 카드",
  family: "유형별 단체 카드(4인)",
  full: "전체 단체 카드(16인)",
};
const teams: Record<string, string> = {
  visual: "시각형",
  auditory: "청각형",
  tactile: "촉각형",
  motion: "운동형",
  "group-photo": "16인 전체",
};
const clock = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const money = (vouchers: number) =>
  (vouchers * 2000).toLocaleString("ko-KR") + "원";
const states = {
  all: "전체",
  pending: "당첨 · 지급 대기",
  paid: "지급 완료",
  available: "미당첨",
};

export function PrizeLedgerView({
  rows,
  requested,
  pay,
}: {
  rows: PrizeRow[];
  requested?: string;
  pay: (form: FormData) => Promise<void>;
}) {
  const selected =
    requested && Object.hasOwn(states, requested) ? requested : "all";
  const stateOf = (r: PrizeRow) =>
    r.paid_at ? "paid" : r.issued_at ? "pending" : "available";
  const sum = (items: typeof rows) =>
    items.reduce((n, r) => n + Number(r.vouchers), 0);
  const pending = rows.filter((r) => stateOf(r) === "pending");
  const paid = rows.filter((r) => stateOf(r) === "paid");
  const available = rows.length - paid.length - pending.length;
  const visible = rows.filter(
    (r) => selected === "all" || stateOf(r) === selected,
  );

  const totalVouchers = sum(rows);
  const counts = {
    all: rows.length,
    pending: pending.length,
    paid: paid.length,
    available,
  };
  return (
    <main id="main" className={styles.page}>
      <Link href="/events/sdj" className={styles.back}>
        ← 서여고 이벤트
      </Link>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p>송원제 · 서여고 스페셜 이벤트</p>
          <h1>매점권 지급 현황</h1>
          <span>
            총 상금 <b>{money(totalVouchers)}</b> · 2,000원권 {totalVouchers}장
          </span>
        </div>
        <div className={styles.stub}>
          <Image src={voucher} alt="" width={64} height={64} />
          <div>
            <strong>
              {sum(paid)}
              <small> / {totalVouchers}장</small>
            </strong>
            <span>지급한 매점권</span>
          </div>
        </div>
      </header>
      <dl className={styles.stats}>
        <div>
          <dt>지급 대기</dt>
          <dd>
            {counts.pending}
            <small>건</small>
          </dd>
          <span>{money(sum(pending))} 지급 예정</span>
        </div>
        <div>
          <dt>지급 완료</dt>
          <dd>
            {counts.paid}
            <small>건</small>
          </dd>
          <span>{money(sum(paid))} 지급</span>
        </div>
        <div>
          <dt>남은 당첨 번호</dt>
          <dd>
            {available}
            <small>개</small>
          </dd>
          <span>
            전체 {rows.length}개 중 {counts.pending + counts.paid}개 당첨
          </span>
        </div>
      </dl>
      <section className={styles.ledger} aria-labelledby="prize-list">
        <h2 id="prize-list">카드별 지급대장</h2>
        <p>
          카드 뒷면의 번호를 확인하고, 매점권을 건넨 뒤 지급 완료로 표시하세요.
        </p>
        <nav className={styles.filters} aria-label="지급 상태">
          {(Object.keys(states) as (keyof typeof states)[]).map((key) => (
            <Link
              key={key}
              aria-current={selected === key ? "page" : undefined}
              href={key === "all" ? "/admin/sdj-prizes" : `?status=${key}`}
            >
              {key === "pending" ? "지급 대기" : states[key]}{" "}
              <b>{counts[key]}</b>
            </Link>
          ))}
        </nav>
        <ul className={styles.list}>
          {visible.map((r) => {
            const card = getGoods(r.design),
              status = stateOf(r);
            return (
              <li key={r.number} className={styles.row} data-state={status}>
                <span className={styles.number}>
                  {formatSdjPrizeNumber(r.number)}
                </span>
                <div className={styles.cardName}>
                  {card && (
                    <Image
                      src={`/characters/thumbs/${card.code}${card.code === "auditory-solo-flexible" ? "-v2" : ""}.png`}
                      width={42}
                      height={42}
                      alt=""
                    />
                  )}
                  <div>
                    <small>
                      {labels[r.kind]}
                      {card && ` · ${card.name}`}
                    </small>
                    <strong>{card?.title ?? teams[r.design]}</strong>
                  </div>
                </div>
                <div className={styles.value}>
                  <strong>매점권 {r.vouchers}장</strong>
                  <small>{money(r.vouchers)}</small>
                </div>
                <div className={styles.state}>
                  <span>{states[status]}</span>
                  {status === "pending" && (
                    <form action={pay}>
                      <input type="hidden" name="number" value={r.number} />
                      <button
                        type="submit"
                        aria-label={`${formatSdjPrizeNumber(r.number)} 지급 완료로 표시`}
                      >
                        지급 완료로 표시
                      </button>
                    </form>
                  )}
                </div>
                {r.issued_at && (
                  <div className={styles.history}>
                    <span>당첨 {clock.format(new Date(r.issued_at))}</span>
                    {r.paid_at && (
                      <span>지급 {clock.format(new Date(r.paid_at))}</span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!visible.length && (
          <div className={styles.empty}>
            <Image src="/seoipi-prize.png" alt="" width={64} height={72} />
            <div>
              <strong>
                {selected === "pending"
                  ? "지급을 기다리는 카드가 없어요."
                  : "이 상태의 카드가 없어요."}
              </strong>
              {selected === "pending" && (
                <p>당첨자가 생기면 이곳에 카드 번호와 지급 버튼이 나타나요.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
