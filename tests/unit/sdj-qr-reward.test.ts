import { expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

it("QR 참여 후 첫 공부캐가 등록되면 미개봉 초대 카드 한 장만 추가한다", async () => {
  const db = new PGlite();
  try {
    for (const file of ["003_collections", "018_sdj_qr_reward"]) {
      await db.exec(await readFile("db/" + file + ".sql", "utf8"));
    }
    for (const id of ["qr", "normal"]) {
      await db.query(
        "INSERT INTO collection_accounts(kakao_id,invite_code) VALUES($1,$1)",
        [id],
      );
    }
    const claim = () =>
      db.query<{ status: string }>(
        "SELECT claim_sdj_qr_reward(id) AS status FROM collection_accounts WHERE kakao_id='qr'",
      );
    expect((await claim()).rows[0].status).toBe("awaiting_result");
    expect(
      (await db.query("SELECT * FROM collection_cards")).rows,
    ).toHaveLength(0);
    await db.exec(
      "SELECT register_collection(id,gen_random_uuid(),'visual-solo-planned') FROM collection_accounts",
    );
    expect((await claim()).rows[0].status).toBe("already_granted");
    const gifts = await db.query<{kakao_id:string;type_code:string}>(
      "SELECT kakao_id,type_code FROM collection_cards JOIN collection_accounts ON account_id=id WHERE source='referral' AND opened_at IS NULL",
    );
    expect(gifts.rows).toHaveLength(1);
    expect(gifts.rows[0].kakao_id).toBe("qr");
    expect(gifts.rows[0].type_code).not.toBe("visual-solo-planned");
    expect(
      (await db.query("SELECT * FROM collection_referrals")).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query<{ status: string }>(
          "SELECT claim_sdj_qr_reward(id) AS status FROM collection_accounts WHERE kakao_id='normal'",
        )
      ).rows[0].status,
    ).toBe("granted");
  } finally {
    await db.close();
  }
}, 60000);
