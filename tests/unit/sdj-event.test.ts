import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const mocks = vi.hoisted(() => ({
  owner: null as { id: string } | null,
  query: vi.fn(),
}));
vi.mock("@/lib/collection-server", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/collection-server")>();
  return { ...original, account: async () => mocks.owner };
});
vi.mock("@/lib/db", () => ({
  database:
    () =>
    (parts: TemplateStringsArray, ...values: unknown[]) =>
      mocks.query(
        parts.reduce(
          (sql, part, index) => sql + (index ? "$" + index : "") + part,
          "",
        ),
        values,
      ),
}));
import { GET, POST } from "../../src/app/api/events/sdj/route";
import { authReturnPath } from "../../src/lib/auth-contract";
import { SDJ_EVENT } from "../../src/lib/sdj-event";
let db: PGlite;
const origin = "https://study.example";
const request = (data: unknown = { source: "poster_qr" }, from = origin) =>
  new Request(origin + "/api/events/sdj", {
    method: "POST",
    headers: { Origin: from, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
beforeAll(async () => {
  db = new PGlite();
  await db.exec("CREATE TABLE collection_accounts(id uuid PRIMARY KEY)");
  await db.exec(await readFile("db/013_school_event.sql", "utf8"));
}, 60000);
beforeEach(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", origin);
  await db.exec("TRUNCATE collection_accounts CASCADE");
  mocks.owner = { id: randomUUID() };
  await db.query("INSERT INTO collection_accounts VALUES($1)", [
    mocks.owner.id,
  ]);
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[]) =>
      (await db.query(sql, values)).rows,
  );
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => db.close());
it("로그인과 같은 출처 요청이 있어야 참여를 저장한다", async () => {
  expect((await POST(request(undefined, "https://other.example"))).status).toBe(
    403,
  );
  mocks.owner = null;
  expect((await GET()).status).toBe(401);
  expect((await POST(request())).status).toBe(401);
  expect(
    (await db.query("SELECT * FROM school_event_participants")).rows,
  ).toHaveLength(0);
});
it("페이지 조회만으로는 등록하지 않고 명시적인 참여만 저장한다", async () => {
  expect(await (await GET()).json()).toEqual({
    enrolled: false,
    enrolledAt: null,
  });
  expect(
    (await db.query("SELECT * FROM school_event_participants")).rows,
  ).toHaveLength(0);
  const registered = await (await POST(request())).json();
  expect(registered.enrolled).toBe(true);
  expect(await (await GET()).json()).toEqual(registered);
});
it("동시·반복 등록은 한 건으로 보관하고 최초 시각과 경로를 유지한다", async () => {
  const first = await (await POST(request())).json();
  const responses = await Promise.all(
    Array.from({ length: 5 }, () => POST(request({ source: "event_page" }))),
  );
  for (const response of responses)
    expect(await response.json()).toEqual(first);
  expect(
    (await db.query("SELECT event_id, source FROM school_event_participants"))
      .rows,
  ).toEqual([{ event_id: SDJ_EVENT.id, source: "poster_qr" }]);
});
it("다른 계정의 참여 내역은 보여주지 않고 탈퇴하면 관련 기록을 삭제한다", async () => {
  const first = mocks.owner!.id;
  await POST(request());
  mocks.owner = { id: randomUUID() };
  await db.query("INSERT INTO collection_accounts VALUES($1)", [
    mocks.owner.id,
  ]);
  expect(await (await GET()).json()).toEqual({
    enrolled: false,
    enrolledAt: null,
  });
  await db.query("DELETE FROM collection_accounts WHERE id=$1", [first]);
  expect(
    (await db.query("SELECT * FROM school_event_participants")).rows,
  ).toHaveLength(0);
});
it("잘못된 경로·계정 위조 필드·서버 오류를 등록 성공으로 처리하지 않는다", async () => {
  expect((await POST(request({ source: "verified_school" }))).status).toBe(400);
  expect(
    (await POST(request({ source: "poster_qr", accountId: randomUUID() })))
      .status,
  ).toBe(400);
  mocks.query.mockRejectedValueOnce(new Error("database unavailable"));
  expect((await POST(request())).status).toBe(503);
});
it("행사 복귀 경로는 유지하되 외부 주소와 유사 경로는 거절한다", () => {
  for (const path of [
    "/events/sdj",
    "/events/sdj?from=qr&join=1",
    "/events/sdj?join=1",
  ])
    expect(authReturnPath(path)).toBe(path);
  for (const path of [
    "//evil.example/events/sdj",
    "/events/sdj/other",
    "/events/sdj?returnTo=https://evil.example",
    "/events/sdj#external",
    "/events/sdj" + "a".repeat(300),
  ])
    expect(authReturnPath(path)).toBe("/collection");
});
