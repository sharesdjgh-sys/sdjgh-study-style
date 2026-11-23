import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminError, requireAdmin } from "@/lib/admin-server";
import { database } from "@/lib/db";
import { getGoods } from "@/lib/goods";

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
export const dynamic = "force-dynamic";
async function pay(form: FormData) {
  "use server";
  await requireAdmin();
  const number = Number(form.get("number"));
  if (!Number.isInteger(number) || number < 1 || number > 29)
    throw Error("번호를 확인하세요.");
  await database()`UPDATE sdj_prize_cards SET paid_at=now() WHERE number=${number} AND issued_at IS NOT NULL AND paid_at IS NULL`;
  revalidatePath("/admin/sdj-prizes");
}
export default async function PrizeLedger() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AdminError) notFound();
    throw err;
  }
  const rows =
    await database()`SELECT number,design,kind,vouchers,issued_at,paid_at FROM sdj_prize_cards ORDER BY number`;
  const total = rows.reduce((sum, r) => sum + Number(r.vouchers), 0);
  const paid = rows.reduce(
    (sum, r) => sum + (r.paid_at ? Number(r.vouchers) : 0),
    0,
  );
  return (
    <main id="main" className="catalog-shell">
      <h1>서여고 매점권 지급대장</h1>
      <p>
        예산 {(total * 2000).toLocaleString("ko-KR")}원 · 2,000원권 {total}장 중{" "}
        {paid}장 지급 · 잔여 {total - paid}장
      </p>
      <p>학생의 소장 카드 뒷면과 번호를 확인한 뒤 지급을 기록하세요.</p>
      <table>
        <caption>당첨 번호별 배정 및 지급 현황</caption>
        <thead>
          <tr>
            {["번호", "카드", "종류", "매점권", "지급 상태"].map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.number}>
              <td>{r.number}</td>
              <td>{getGoods(r.design)?.title ?? teams[r.design]}</td>
              <td>{labels[r.kind]}</td>
              <td>{r.vouchers}장</td>
              <td>
                {r.paid_at ? (
                  "지급 완료"
                ) : r.issued_at ? (
                  <form action={pay}>
                    <input type="hidden" name="number" value={r.number} />
                    <button type="submit" className="button secondary">
                      지급 완료 기록
                    </button>
                  </form>
                ) : (
                  "미발급"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
