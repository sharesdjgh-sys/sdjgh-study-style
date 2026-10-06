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
import { GET as authSession } from "../../src/app/api/auth/session/route";
import {
  GET as skillGet,
  POST as skillPost,
} from "../../src/app/api/skills/route";
import { identityHash } from "../../src/lib/auth-server";
import { POST as start } from "../../src/app/api/auth/kakao/start/route";
import { GET as callback } from "../../src/app/api/auth/kakao/callback/route";
import { POST as logout } from "../../src/app/api/auth/logout/route";
import { DELETE as remove } from "../../src/app/api/collection/account/route";
import { POST as open } from "../../src/app/api/collection/rewards/open/route";
import { GET as specialCard } from "../../src/app/api/collection/special-card/route";
import {
  GET as results,
  POST as saveResult,
} from "../../src/app/api/results/route";
import { parseSession, DAY } from "../../src/lib/storage";
import { scoreAnswers } from "../../src/lib/scoring";
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
  await db.exec(await readFile("db/004_saved_results.sql", "utf8"));
  await db.exec(await readFile("db/005_account_lifecycle.sql", "utf8"));
  await db.exec(await readFile("db/006_skill_hearts.sql", "utf8"));
}, 60000);
beforeEach(async () => {
  await db.exec(
    "TRUNCATE collection_accounts,collection_limits,collection_oauth_states,collection_withdrawals CASCADE",
  );
  mocks.jar.clear();
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[]) =>
      (await db.query(sql, values)).rows,
  );
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("KAKAO_REST_API_KEY", "test-key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "test-secret");
  vi.stubEnv(
    "AUTH_IDENTITY_HMAC_SECRET",
    "test-only-identity-key-at-least-32-characters",
  );
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
it("하트 API는 인증·출처·설치 실행 신호를 검사하고 중복 선물을 막는다", async () => {
  expect(
    (
      await skillPost(
        request(
          "/api/skills",
          { action: "install", standalone: true, mobile: true },
          "POST",
          "https://evil.example",
        ),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await skillPost(
        request("/api/skills", {
          action: "install",
          standalone: false,
          mobile: true,
        }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await skillPost(
        request("/api/skills", {
          action: "install",
          standalone: true,
          mobile: false,
        }),
      )
    ).status,
  ).toBe(400);
  mocks.jar.clear();
  expect(
    (
      await skillPost(
        request("/api/skills", { action: "unlock", method: "cornell" }),
      )
    ).status,
  ).toBe(401);
  expect((await (await skillGet()).json()).progress.balance).toBe(0);
  mocks.jar.set("study-collection", "session");
  expect(
    (
      await (
        await skillPost(
          request("/api/skills", {
            action: "install",
            standalone: true,
            mobile: true,
          }),
        )
      ).json()
    ).awarded,
  ).toBe(3);
  expect(
    (
      await (
        await skillPost(
          request("/api/skills", {
            action: "install",
            standalone: true,
            mobile: true,
          }),
        )
      ).json()
    ).awarded,
  ).toBe(0);
  const opened = await skillPost(
    request("/api/skills", { action: "unlock", method: "cornell" }),
  );
  expect(opened.status).toBe(200);
  expect((await opened.json()).progress.balance).toBe(1);
  expect(
    (
      await skillPost(
        request("/api/skills", { action: "unlock", method: "feynman" }),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await skillPost(
        request("/api/skills", { action: "unlock", method: "not-a-skill" }),
      )
    ).status,
  ).toBe(400);
});
it("실천 API는 세 질문과 서버의 10분 경과를 확인한 뒤 하트를 한 번만 지급한다", async () => {
  await register(request("/api/collection/register", { session: session() }));
  const started = await skillPost(
    request("/api/skills", { action: "start", method: "outline" }),
  );
  expect(started.status).toBe(200);
  const run = (await started.json()).progress.practice.id;
  expect(
    (
      await skillPost(
        request("/api/skills", {
          action: "complete",
          id: run,
          answers: [0, 0],
        }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await skillPost(
        request("/api/skills", {
          action: "complete",
          id: run,
          answers: [0, 0, 0],
        }),
      )
    ).status,
  ).toBe(409);
  await db.query(
    "UPDATE skill_practices SET updated_at=now()-interval '601 seconds' WHERE id=$1",
    [run],
  );
  expect(
    (
      await (
        await skillPost(
          request("/api/skills", {
            action: "complete",
            id: run,
            answers: [3, 3, 3],
          }),
        )
      ).json()
    ).awarded,
  ).toBe(1);
  expect(
    (
      await (
        await skillPost(
          request("/api/skills", {
            action: "complete",
            id: run,
            answers: [3, 3, 3],
          }),
        )
      ).json()
    ).awarded,
  ).toBe(0);
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
it.each(["visual", "auditory", "tactile", "motion"])(
  "%s 사진은 해당 유형 네 종을 개봉해야 열리고 다른 유형은 잠긴다",
  async (family) => {
    const url = `${origin}/api/collection/special-card?family=${family}`;
    mocks.jar.clear();
    expect((await specialCard(new Request(url))).status).toBe(401);
    expect((await specialCard(new Request(url + "&format=mp4"))).status).toBe(
      401,
    );
    mocks.jar.set("study-collection", "session");
    const members = STUDY_TYPES.filter((type) => type.modality === family);
    for (const [index, type] of members.entries()) {
      await db.query(
        "INSERT INTO collection_cards(account_id,type_code,source,opened_at) VALUES($1,$2,'referral',$3)",
        [owner, type.code, index === 3 ? null : new Date()],
      );
    }
    expect((await specialCard(new Request(url))).status).toBe(403);
    expect((await specialCard(new Request(url + "&format=mp4"))).status).toBe(
      403,
    );
    await db.query(
      "UPDATE collection_cards SET opened_at=now() WHERE account_id=$1",
      [owner],
    );
    const response = await specialCard(new Request(url));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(digest(new Uint8Array(await response.arrayBuffer()))).toBe(
      digest(await readFile(`art/characters/special/families/${family}.webp`)),
    );
    const download = await specialCard(new Request(url + "&download=1"));
    expect(download.headers.get("content-type")).toBe("image/png");
    expect(download.headers.get("content-disposition")).toBe(
      `attachment; filename="gongbucae-${family}.png"`,
    );
    expect(digest(new Uint8Array(await download.arrayBuffer()))).toBe(
      digest(await readFile(`art/characters/special/families/${family}.png`)),
    );
    const videoBytes = await readFile(
      `art/characters/special/families/${family}-loop-8s-v1.mp4`,
    );
    const video = await specialCard(
      new Request(url + "&format=mp4&download=1"),
    );
    expect(video.status).toBe(200);
    expect(video.headers.get("content-type")).toBe("video/mp4");
    expect(video.headers.get("content-disposition")).toBe(
      `attachment; filename="gongbucae-${family}.mp4"`,
    );
    expect(digest(new Uint8Array(await video.arrayBuffer()))).toBe(
      digest(videoBytes),
    );
    const partial = await specialCard(
      new Request(url + "&format=mp4", { headers: { Range: "bytes=0-31" } }),
    );
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe(
      `bytes 0-31/${videoBytes.length}`,
    );
    expect(Buffer.from(await partial.arrayBuffer())).toEqual(
      videoBytes.subarray(0, 32),
    );
    const suffix = await specialCard(
      new Request(url + "&format=mp4", { headers: { Range: "bytes=-16" } }),
    );
    expect(suffix.status).toBe(206);
    expect(Buffer.from(await suffix.arrayBuffer())).toEqual(
      videoBytes.subarray(-16),
    );
    const invalid = await specialCard(
      new Request(url + "&format=mp4", {
        headers: { Range: `bytes=${videoBytes.length}-` },
      }),
    );
    expect(invalid.status).toBe(416);
    expect(
      (
        await specialCard(
          new Request(
            `${origin}/api/collection/special-card?family=${family === "visual" ? "auditory" : "visual"}`,
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (await specialCard(new Request(`${origin}/api/collection/special-card`)))
        .status,
    ).toBe(403);
  },
);
it("알 수 없는 유형과 파일 경로는 사진 요청으로 허용하지 않는다", async () => {
  expect(
    (
      await specialCard(
        new Request(`${origin}/api/collection/special-card?format=mp4`),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await specialCard(
        new Request(
          `${origin}/api/collection/special-card?family=visual&format=unknown`,
        ),
      )
    ).status,
  ).toBe(400);
  for (const family of ["", "all", "../group-photo", "visual/../../secret"]) {
    expect(
      (
        await specialCard(
          new Request(
            `${origin}/api/collection/special-card?family=${encodeURIComponent(family)}`,
          ),
        )
      ).status,
    ).toBe(400);
  }
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
  ).toMatchObject({ outcome: "referred", bonus: expect.any(String) });
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
    new URL(response.headers.get("location")!).searchParams.get("prompt"),
  ).toBeNull();
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
it("카카오톡 내부 브라우저에서는 지원하지 않는 재인증 옵션을 보내지 않는다", async () => {
  const input = request("/api/auth/kakao/start");
  input.headers.set("user-agent", "Mozilla/5.0 KAKAOTALK 26.1.0");
  const response = await start(input);
  const redirect = new URL(response.headers.get("location")!);
  expect(redirect.hostname).toBe("kauth.kakao.com");
  expect(redirect.searchParams.has("prompt")).toBe(false);
  expect(redirect.searchParams.get("state")).toBeTruthy();
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
it("계정 삭제는 도감과 세션, 검사 답변과 점수를 삭제한다", async () => {
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
  expect(
    (await db.query("SELECT * FROM saved_study_results")).rows,
  ).toHaveLength(0);
});

it("인증 상태는 도감 조회 없이 확인하고 실패를 비로그인으로 위장하지 않는다", async () => {
  mocks.query.mockClear();
  const response = await authSession();
  expect(await response.json()).toEqual({
    signedIn: true,
    configured: true,
    accountId: owner,
  });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(mocks.query).toHaveBeenCalledTimes(1);
  mocks.query.mockRejectedValueOnce(new Error("offline"));
  expect((await authSession()).status).toBe(503);
  mocks.jar.clear();
  expect(await (await authSession()).json()).toEqual({
    signedIn: false,
    configured: true,
  });
});

it("JSON 로그인 시작은 재인증 없는 카카오 URL을 반환한다", async () => {
  const input = request("/api/auth/kakao/start");
  input.headers.set("accept", "application/json");
  const response = await start(input);
  const url = new URL((await response.json()).authorizationUrl);
  expect(response.status).toBe(200);
  expect(url.origin).toBe("https://kauth.kakao.com");
  expect(url.searchParams.has("prompt")).toBe(false);
  expect(url.searchParams.get("state")).toBeTruthy();
});

async function kakaoLogin(id: number) {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: "provider-token" }))
      .mockResolvedValueOnce(Response.json({ id })),
  );
  const beginning = await start(request("/api/auth/kakao/start"));
  const state = new URL(beginning.headers.get("location")!).searchParams.get(
    "state",
  );
  return callback(
    new Request(
      `${origin}/api/auth/kakao/callback?state=${state}&code=test-code`,
    ),
  );
}

it("탈퇴는 식별값만 남기고 7일 직전까지 OAuth 재가입·세션 발급을 차단한다", async () => {
  await register(request("/api/collection/register", { session: session() }));
  const deletion = await remove(
    request("/api/collection/account", {}, "DELETE"),
  );
  expect(deletion.status).toBe(200);
  const withdrawn = (
    await db.query<{
      identity_hash: string;
      withdrawn_at: Date;
      rejoin_after: Date;
    }>("SELECT * FROM collection_withdrawals")
  ).rows[0];
  expect(withdrawn.identity_hash).toBe(identityHash("1"));
  expect(Object.keys(withdrawn).sort()).toEqual([
    "identity_hash",
    "rejoin_after",
    "withdrawn_at",
  ]);
  expect(
    new Date(withdrawn.rejoin_after).getTime() -
      new Date(withdrawn.withdrawn_at).getTime(),
  ).toBe(7 * DAY);
  expect((await kakaoLogin(1)).headers.get("location")).toContain(
    "auth=rejoin_blocked",
  );
  await db.query(
    "UPDATE collection_withdrawals SET withdrawn_at=now()-interval '168 hours'+interval '1 minute',rejoin_after=now()+interval '1 minute'",
  );
  expect((await kakaoLogin(1)).headers.get("location")).toContain(
    "auth=rejoin_blocked",
  );
  expect(
    (await db.query("SELECT * FROM collection_accounts")).rows,
  ).toHaveLength(0);
  expect(
    (await db.query("SELECT * FROM collection_sessions")).rows,
  ).toHaveLength(0);
});

it("7일 이후 재가입은 새 계정이며 과거 검사·도감과 신규 초대 보상을 복구하지 않는다", async () => {
  await remove(request("/api/collection/account", {}, "DELETE"));
  await db.query(
    "UPDATE collection_withdrawals SET withdrawn_at=now()-interval '168 hours',rejoin_after=now()",
  );
  expect((await kakaoLogin(1)).headers.get("location")).toContain(
    "auth=success",
  );
  const returned = await (await collection()).json();
  expect(returned.accountId).not.toBe(owner);
  expect(returned.referralEligible).toBe(false);
  expect(returned.cards).toEqual([]);
  expect((await (await results()).json()).results).toEqual([]);
  const inviter = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,'2','BBBBBBBBBB')",
    [inviter],
  );
  await db.query("SELECT register_collection($1,$2,'visual-solo-planned')", [
    inviter,
    randomUUID(),
  ]);
  await db.query(
    "INSERT INTO collection_invites VALUES($1,$2,now()+interval '1 day')",
    [digest("returning-invite"), inviter],
  );
  mocks.jar.set("study-invite", "returning-invite");
  const response = await register(
    request("/api/collection/register", {
      session: session(),
      inviteCode: "BBBBBBBBBB",
    }),
  );
  expect(await response.json()).toMatchObject({
    outcome: "registered",
    hearts: [{ code: "visual-solo-planned", amount: expect.any(Number) }],
  });
  expect(
    (await db.query("SELECT * FROM collection_referrals")).rows,
  ).toHaveLength(0);
  expect(
    (
      await db.query("SELECT * FROM collection_cards WHERE account_id=$1", [
        inviter,
      ])
    ).rows,
  ).toHaveLength(1);
  expect((await (await collection()).json()).cards).toHaveLength(1);
  const newcomer = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,'3','CCCCCCCCCC')",
    [newcomer],
  );
  const returningCode = (await (await collection()).json()).inviteCode;
  expect(
    (
      await db.query<{ outcome: string }>(
        "SELECT register_collection($1,$2,'motion-team-flexible',$3) AS outcome",
        [newcomer, randomUUID(), returningCode],
      )
    ).rows[0].outcome,
  ).toBe("referred");
  expect((await (await collection()).json()).pending).toHaveLength(1);
});

it("탈퇴 트랜잭션이 실패하면 식별 기록과 계정 삭제를 모두 롤백한다", async () => {
  await register(request("/api/collection/register", { session: session() }));
  await db.exec(
    "CREATE FUNCTION reject_account_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test_failure'; END; $$; CREATE TRIGGER reject_delete BEFORE DELETE ON collection_accounts FOR EACH ROW EXECUTE FUNCTION reject_account_delete();",
  );
  try {
    expect(
      (await remove(request("/api/collection/account", {}, "DELETE"))).status,
    ).toBe(503);
    expect(
      (await db.query("SELECT * FROM collection_withdrawals")).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("SELECT * FROM collection_accounts")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("SELECT * FROM saved_study_results")).rows,
    ).toHaveLength(1);
    expect(mocks.jar.get("study-collection")).toBe("session");
  } finally {
    await db.exec(
      "DROP TRIGGER reject_delete ON collection_accounts; DROP FUNCTION reject_account_delete()",
    );
  }
});

it("식별 키 누락 시 제한을 우회하지 않고 계정 데이터도 삭제하지 않는다", async () => {
  vi.stubEnv("AUTH_IDENTITY_HMAC_SECRET", "");
  expect(
    (await remove(request("/api/collection/account", {}, "DELETE"))).status,
  ).toBe(503);
  expect(
    (await db.query("SELECT * FROM collection_accounts")).rows,
  ).toHaveLength(1);
  expect(
    (await start(request("/api/auth/kakao/start"))).headers.get("location"),
  ).toContain("auth=unavailable");
});

it("동일 계정의 중복 로그인은 계정을 늘리지 않고 탈퇴 후에는 모든 재발급을 막는다", async () => {
  const fingerprint = identityHash("7000");
  const establish = (n: number) =>
    db.query<{ account_id: string | null; rejoin_after: Date | null }>(
      "SELECT * FROM establish_collection_session('7000',$1,$2,$3,'')",
      [fingerprint, `DDDDDDDDD${n}`, digest(`new-session-${n}`)],
    );
  const issued = await Promise.all([establish(1), establish(2)]);
  expect(issued[0].rows[0].account_id).toBe(issued[1].rows[0].account_id);
  const id = issued[0].rows[0].account_id;
  await db.query("SELECT withdraw_collection_account($1,$2)", [
    id,
    fingerprint,
  ]);
  const blocked = await Promise.all([establish(3), establish(4)]);
  expect(
    blocked.every(
      (result) =>
        result.rows[0].account_id === null && result.rows[0].rejoin_after,
    ),
  ).toBe(true);
  expect(
    (
      await db.query("SELECT * FROM collection_sessions WHERE account_id=$1", [
        id,
      ])
    ).rows,
  ).toHaveLength(0);
  expect(
    (await db.query("SELECT * FROM collection_accounts WHERE kakao_id='7000'"))
      .rows,
  ).toHaveLength(0);
});

it("로그인한 계정에 서버 재채점 결과를 저장하고 같은 응답 재전송은 중복을 만들지 않는다", async () => {
  const s = session();
  for (let i = 0; i < 2; i++)
    expect(
      (
        await saveResult(
          request("/api/results", { ...s, scores: { visual: 999 } }),
        )
      ).status,
    ).toBe(200);
  const stored = (
    await db.query<{ scores: unknown; session: unknown }>(
      "SELECT scores,session FROM saved_study_results",
    )
  ).rows;
  expect(stored).toHaveLength(1);
  expect(stored[0].scores).toEqual(scoreAnswers(s.answers));
  expect(stored[0].session).not.toHaveProperty("scores");
  const response = await results();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  expect((await response.json()).results).toEqual([s]);
  const changed = { ...s, answers: { ...s.answers, A01: "auditory" } };
  expect((await saveResult(request("/api/results", changed))).status).toBe(409);
});
it("응답 검증, 로그인, 출처 검증과 검사 소유권을 강제한다", async () => {
  const s = session();
  expect(
    (
      await saveResult(
        request("/api/results", s, "POST", "https://evil.example"),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await saveResult(
        request("/api/results", { ...s, result: "motion-team-flexible" }),
      )
    ).status,
  ).toBe(400);
  expect(
    (await saveResult(request("/api/results", { ...s, answers: {} }))).status,
  ).toBe(400);
  const other = randomUUID();
  await db.query(
    "INSERT INTO collection_accounts(id,kakao_id,invite_code) VALUES($1,'other','BBBBBBBBBB')",
    [other],
  );
  await db.query(
    "INSERT INTO collection_sessions VALUES($1,$2,now()+interval '1 day')",
    [digest("other-session"), other],
  );
  expect((await saveResult(request("/api/results", s))).status).toBe(200);
  mocks.jar.set("study-collection", "other-session");
  expect((await (await results()).json()).results).toEqual([]);
  expect((await saveResult(request("/api/results", s))).status).toBe(409);
  expect(
    (await register(request("/api/collection/register", { session: s })))
      .status,
  ).toBe(409);
  expect((await db.query("SELECT * FROM collection_cards")).rows).toHaveLength(
    0,
  );
  mocks.jar.clear();
  expect((await results()).status).toBe(401);
  expect((await saveResult(request("/api/results", s))).status).toBe(401);
});
it("7일 지난 서버 결과는 복원하지만 만료된 기기 기록은 신규 업로드하지 않는다", async () => {
  const s = session();
  s.startedAt -= 30 * DAY;
  s.updatedAt -= 30 * DAY;
  s.completedAt -= 30 * DAY;
  expect(parseSession(JSON.stringify(s))).toBeNull();
  expect(parseSession(JSON.stringify(s), Date.now(), true)).toEqual(s);
  expect((await saveResult(request("/api/results", s))).status).toBe(400);
  await db.query(
    "INSERT INTO saved_study_results(run_id,account_id,version,type_code,session,scores,completed_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      s.runId,
      owner,
      s.version,
      s.result,
      JSON.stringify(s),
      JSON.stringify(scoreAnswers(s.answers)),
      new Date(s.completedAt),
    ],
  );
  expect((await (await results()).json()).results).toEqual([s]);
  expect(
    (await register(request("/api/collection/register", { session: s })))
      .status,
  ).toBe(200);
});
