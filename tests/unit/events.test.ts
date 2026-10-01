import { describe, it, expect, afterEach, vi } from "vitest";
import { eventSchema } from "../../src/lib/event-schema";
import { VERSION, QUESTIONS } from "../../src/lib/content";
import { POST } from "../../src/app/api/events/route";
const payload = {
  runId: "123e4567-e89b-42d3-a456-426614174000",
  version: VERSION,
  source: "direct",
  name: "start",
  detail: "",
};
afterEach(() => vi.unstubAllEnvs());
describe("통계의 입력 경계", () => {
  it("개인 응답 등의 추가 필드를 거부한다", () =>
    expect(
      eventSchema.safeParse({ ...payload, answers: { v1: 5 } }).success,
    ).toBe(false));
  it("문항 번호와 공유 채널을 제한한다", () => {
    const question = (detail: string) =>
      eventSchema.safeParse({ ...payload, name: "question", detail }).success;
    expect(question("1")).toBe(true);
    expect(question(String(QUESTIONS.length))).toBe(true);
    for (const detail of ["0", "01", String(QUESTIONS.length + 1), "1.5"])
      expect(question(detail)).toBe(false);
    expect(
      eventSchema.safeParse({ ...payload, name: "share", detail: "kakao" })
        .success,
    ).toBe(true);
  });
  it("외부 출처 요청을 거부한다", async () =>
    expect(
      (
        await POST(
          new Request("https://example.com/api/events", {
            method: "POST",
            headers: {
              origin: "https://other.com",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }),
        )
      ).status,
    ).toBe(403));
  it("DB 미설정이어도 통계 요청을 안전하게 무시한다", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(
      (
        await POST(
          new Request("https://example.com/api/events", {
            method: "POST",
            headers: {
              origin: "https://example.com",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }),
        )
      ).status,
    ).toBe(204);
  });
});
