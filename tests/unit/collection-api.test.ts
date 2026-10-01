import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  it,
  expect,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { QUESTIONS, VERSION, STUDY_TYPES } from "../../src/lib/content";
import { answersFor } from "../answers";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  jar: new Map<string, string>(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) =>
      mocks.jar.has(key) ? { value: mocks.jar.get(key) } : undefined,
    set: (key: string, value: string) => mocks.jar.set(key, value),
  }),
}));
vi.mock("@/lib/db", () => ({
  database: () =>
    Object.assign(
      (parts: TemplateStringsArray, ...values: unknown[]) =>
        mocks.query(
          parts.reduce(
            (sql, part, index) => sql + (index ? `$${index}` : "") + part,
            "",
          ),
          values,
        ),
      { transaction: (queries: Promise<unknown>[]) => Promise.all(queries) },
    ),
}));
import { POST as register } from "../../src/app/api/collection/register/route";
import {
  POST as capture,
  GET as referral,
} from "../../src/app/api/referrals/route";
import { GET as collection } from "../../src/app/api/collection/route";
import { POST as start } from "../../src/app/api/auth/kakao/start/route";
import { GET as callback } from "../../src/app/api/auth/kakao/callback/route";
import { POST as logout } from "../../src/app/api/auth/logout/route";
import { DELETE as remove } from "../../src/app/api/collection/account/route";
import { POST as open } from "../../src/app/api/collection/rewards/open/route";
import { GET as specialCard } from "../../src/app/api/collection/special-card/route";
let db: PGlite;
let owner: string;
const origin = "https://study.example";
const digest = (s: string | Uint8Array) =>
  createHash("sha256").update(s).digest("hex");
const request = (
  path: string,
  data: unknown = {},
  method = "POST",
  from = origin,
) =>
  new Request(origin + path, {
    method,
    headers: { Origin: from, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
function session() {
  const now = Date.now();
  return {
    version: VERSION,
    runId: randomUUID(),
    source: "direct",
    startedAt: now,
    updatedAt: now,
    completedAt: now,
    index: QUESTIONS.length - 1,
    choices: {},
    result: "visual-solo-planned",
    answers: answersFor("visual-solo-planned"),
  };
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile("db/003_collections.sql", "utf8"));
}, 60000);
beforeEach(async () => {
  await db.exec(
    "TRUNCATE collection_accounts,collection_limits,collection_oauth_states CASCADE",
  );
  mocks.jar.clear();
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[]) =>
      (await db.query(sql, values)).rows,
  );
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "test-secret");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", origin);
  owner = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,'1','AAAAAAAAAA')",
    [owner],
  );
  await db.query(
    "INSERT INTO collection_sessions VALUES($1,$2,now()+interval '1 day')",
    [digest("session"), owner],
  );
  mocks.jar.set("study-collection", "session");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
afterAll(async () => {
  await db.close();
});
it("스페셜 사진은 16종 선물을 모두 개봉한 계정만 보고 PNG로 저장한다", async () => {
  const photograph = () =>
    specialCard(new Request(origin + "/api/collection/special-card"));
  mocks.jar.clear();
  expect((await photograph()).status).toBe(401);
  mocks.jar.set("study-collection", "session");
  for (const [index, type] of STUDY_TYPES.entries()) {
    await db.query(
      "INSERT INTO collection_cards(account_id,type_code,source,opened_at) VALUES($1,$2,'referral',$3)",
      [owner, type.code, index === 15 ? null : new Date()],
    );
  }
  expect((await photograph()).status).toBe(403);
  const reward = (
    await db.query<{ reward_id: string }>(
      "SELECT reward_id FROM collection_cards WHERE account_id=$1 AND opened_at IS NULL",
      [owner],
    )
  ).rows[0].reward_id;
  expect(
    (await open(request("/api/collection/rewards/open", { id: reward })))
      .status,
  ).toBe(200);
  const preview = await photograph();
  expect(preview.status).toBe(200);
  expect(preview.headers.get("content-type")).toBe("image/webp");
  expect(preview.headers.get("cache-control")).toBe("private, no-store");
  expect(preview.headers.get("vary")).toBe("Cookie");
  expect(digest(new Uint8Array(await preview.arrayBuffer()))).toBe(
    digest(await readFile("art/characters/special/group-photo.webp")),
  );
  const saved = await specialCard(
    new Request(origin + "/api/collection/special-card?download=1"),
  );
  expect(saved.headers.get("content-type")).toBe("image/png");
  expect(saved.headers.get("content-disposition")).toBe(
    'attachment; filename="gongbucae-special-16.png"',
  );
  expect(digest(new Uint8Array(await saved.arrayBuffer()))).toBe(
    digest(await readFile("art/characters/special/group-photo.png")),
  );
  await logout(request("/api/auth/logout"));
  expect((await photograph()).status).toBe(401);
});
it("도감 조회에 실패하면 스페셜 사진을 제공하지 않는다", async () => {
  mocks.query.mockRejectedValueOnce(new Error("offline"));
  const response = await specialCard(
    new Request(origin + "/api/collection/special-card"),
  );
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "unavailable" });
});
it("로그인 없이 등록하거나 다른 사이트에서 요청할 수 없다", async () => {
  expect(
    (
      await register(
        request(
          "/api/collection/register",
          { session: session() },
          "POST",
          "https://evil.example",
        ),
      )
    ).status,
  ).toBe(403);
  mocks.jar.clear();
  expect(
    (
      await register(
        request("/api/collection/register", { session: session() }),
      )
    ).status,
  ).toBe(401);
});
it("미완료·결과 조작·재검사는 서버 검증을 통과하지 못한다", async () => {
  const s = session();
  delete s.answers.A01;
  for (const input of [
    s,
    { ...session(), result: "motion-team-flexible" },
    { ...session(), isRetake: true },
  ])
    expect(
      (await register(request("/api/collection/register", { session: input })))
        .status,
    ).toBe(400);
  expect((await db.query("SELECT * FROM collection_cards")).rows).toHaveLength(
    0,
  );
});
it("첫 결과만 저장하고 조회에는 응답·카카오 회원번호가 포함되지 않는다", async () => {
  const s = session();
  expect(
    (await register(request("/api/collection/register", { session: s })))
      .status,
  ).toBe(200);
  const response = await collection();
  const data = await response.json();
  expect(data.firstType).toBe(s.result);
  expect(data.cards).toHaveLength(1);
  expect(data).not.toHaveProperty("answers");
  expect(data).not.toHaveProperty("kakao_id");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(
    (
      await db.query<{ column_name: string }>(
        "SELECT column_name FROM information_schema.columns WHERE table_name='collection_accounts'",
      )
    ).rows.map((r) => r.column_name),
  ).not.toContain("answers");
});
it("최초 유효 초대 코드를 유지하고 이미 등록한 사용자는 새 추천에 참여하지 않는다", async () => {
  for (const [n, code] of [
    ["2", "BBBBBBBBBB"],
    ["3", "CCCCCCCCCC"],
  ]) {
    const id = randomUUID();
    await db.query(
      "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,$2,$3)",
      [id, n, code],
    );
    await db.query(
      "SELECT register_collection($1,$2,'visual-solo-planned',NULL)",
      [id, randomUUID()],
    );
  }
  expect(
    (await capture(request("/api/referrals", { code: "BBBBBBBBBB" }))).status,
  ).toBe(200);
  expect(
    await (
      await capture(request("/api/referrals", { code: "CCCCCCCCCC" }))
    ).json(),
  ).toEqual({ code: "BBBBBBBBBB" });
  expect(
    await (
      await register(
        request("/api/collection/register", {
          session: session(),
          inviteCode: "CCCCCCCCCC",
        }),
      )
    ).json(),
  ).toEqual({ outcome: "referred" });
  expect(
    (
      await db.query<{ invite_code: string }>(
        "SELECT a.invite_code FROM collection_referrals r JOIN collection_accounts a ON a.id=r.inviter_id WHERE r.invitee_id=$1",
        [owner],
      )
    ).rows[0].invite_code,
  ).toBe("BBBBBBBBBB");
  expect(
    await (
      await capture(request("/api/referrals", { code: "CCCCCCCCCC" }))
    ).json(),
  ).toMatchObject({ reason: "already_registered" });
});
it("만료된 추천 연결은 복원하지 않는다", async () => {
  await register(request("/api/collection/register", { session: session() }));
  await db.query(
    "INSERT INTO collection_invites VALUES($1,$2,now()-interval '1 second')",
    [digest("expired"), owner],
  );
  mocks.jar.set("study-invite", "expired");
  expect(await (await referral()).json()).toEqual({ code: null });
});
it("카카오 OAuth는 상태와 브라우저를 검증하고 취소 시 계정을 만들지 않는다", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  expect(
    (
      await callback(
        new Request(origin + "/api/auth/kakao/callback?state=forged&code=bad"),
      )
    ).headers.get("location"),
  ).toContain("auth=expired");
  const response = await start(request("/api/auth/kakao/start"));
  const state = new URL(response.headers.get("location")!).searchParams.get(
    "state",
  );
  expect(new URL(response.headers.get("location")!).hostname).toBe(
    "kauth.kakao.com",
  );
  expect(
    (
      await callback(
        new Request(
          origin +
            `/api/auth/kakao/callback?state=${state}&error=access_denied`,
        ),
      )
    ).headers.get("location"),
  ).toContain("auth=cancelled");
  expect(fetcher).not.toHaveBeenCalled();
});
it("카카오 성공 응답으로 서버 세션을 만들고 같은 콜백을 재사용하지 않는다", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ access_token: "provider-token" }))
    .mockResolvedValueOnce(Response.json({ id: 5000 }));
  vi.stubGlobal("fetch", fetcher);
  const response = await start(request("/api/auth/kakao/start"));
  const state = new URL(response.headers.get("location")!).searchParams.get(
    "state",
  );
  const url =
    origin + `/api/auth/kakao/callback?state=${state}&code=provider-code`;
  expect((await callback(new Request(url))).headers.get("location")).toContain(
    "auth=success",
  );
  expect(mocks.jar.get("study-collection")).not.toBe("session");
  expect((await callback(new Request(url))).headers.get("location")).toContain(
    "auth=expired",
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("다른 계정의 선물을 열지 않고 로그아웃은 도감을 유지한다", async () => {
  await register(request("/api/collection/register", { session: session() }));
  expect(
    (await open(request("/api/collection/rewards/open", { id: randomUUID() })))
      .status,
  ).toBe(404);
  expect((await logout(request("/api/auth/logout"))).status).toBe(200);
  expect(
    (
      await db.query("SELECT * FROM collection_cards WHERE account_id=$1", [
        owner,
      ])
    ).rows,
  ).toHaveLength(1);
  expect((await collection()).status).toBe(200);
  expect((await (await collection()).json()).signedIn).toBe(false);
});
it("계정 삭제는 도감과 세션을 삭제한다", async () => {
  await register(request("/api/collection/register", { session: session() }));
  expect(
    (await remove(request("/api/collection/account", {}, "DELETE"))).status,
  ).toBe(200);
  expect(
    (await db.query("SELECT * FROM collection_accounts")).rows,
  ).toHaveLength(0);
  expect((await db.query("SELECT * FROM collection_cards")).rows).toHaveLength(
    0,
  );
});
