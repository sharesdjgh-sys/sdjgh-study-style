import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canViewSdjPrizes } from "@/lib/sdj-manager";
import { PrizeLedgerView, type PrizeRow } from "./prize-ledger-view";
import { database } from "@/lib/db";

export const dynamic = "force-dynamic";
async function pay(form: FormData) {
  "use server";
  if (!(await canViewSdjPrizes(true))) notFound();
  const number = Number(form.get("number"));
  if (!Number.isInteger(number) || number < 1 || number > 29)
    throw Error("번호를 확인하세요.");
  await database()`UPDATE sdj_prize_cards SET paid_at=now() WHERE number=${number} AND issued_at IS NOT NULL AND paid_at IS NULL`;
  revalidatePath("/admin/sdj-prizes");
}
export default async function PrizeLedger({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await canViewSdjPrizes(true))) notFound();
  const rows = await database()`
    SELECT p.number,p.design,p.kind,p.vouchers,p.issued_at,p.paid_at
    FROM sdj_prize_cards p
    ORDER BY CASE WHEN p.issued_at IS NOT NULL AND p.paid_at IS NULL THEN 0 ELSE 1 END,p.number`;
  return (
    <PrizeLedgerView
      rows={rows as PrizeRow[]}
      requested={(await searchParams).status}
      pay={pay}
    />
  );
}
