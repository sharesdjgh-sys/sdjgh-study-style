import { afterEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const transport = vi.hoisted(() => ({ query: vi.fn(), transaction: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ({
    query: (text: string) => ({
      text,
      then: (
        resolve: (value: unknown) => unknown,
        reject: (reason: unknown) => unknown,
      ) => transport.query(text).then(resolve, reject),
    }),
    transaction: (queries: { text: string }[]) =>
      transport.transaction(queries.map((query) => query.text)),
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("실제 마이그레이션 실행기가 단일 명령 prepared query로 설치되고 재실행해도 도감을 보존한다", async () => {
  const db = new PGlite();
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.spyOn(console, "log").mockImplementation(() => {});
  transport.query.mockImplementation((text: string) => db.query(text));
  transport.transaction.mockImplementation((statements: string[]) =>
    db.transaction(async (tx) => {
      const results = [];
      for (const statement of statements)
        results.push(await tx.query(statement));
      return results;
    }),
  );
  const runner = "../../scripts/migrate.mjs";
  try {
    await import(runner);
    const id = crypto.randomUUID();
    const run = crypto.randomUUID();
    await db.query(
      "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,'migration-test','ABCDEF1234')",
      [id],
    );
    await db.query("SELECT register_collection($1,$2,'visual-solo-planned')", [
      id,
      run,
    ]);
    vi.resetModules();
    await import(runner);
    expect(
      (
        await db.query(
          "SELECT type_code FROM collection_cards WHERE account_id=$1",
          [id],
        )
      ).rows,
    ).toEqual([{ type_code: "visual-solo-planned" }]);
    expect(
      (
        await db.query<{ total: number }>(
          "SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
        )
      ).rows[0].total,
    ).toBe(10);
    expect((await db.query("SELECT study_rollup()")).rows).toHaveLength(1);
  } finally {
    await db.close();
  }
}, 60000);
