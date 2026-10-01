import { afterEach, expect, it, vi } from "vitest";
import { sameOrigin } from "../../src/lib/site";

afterEach(() => vi.unstubAllEnvs());

it("Next.js가 내부 주소를 localhost로 정규화해도 설정된 127.0.0.1 요청을 허용한다", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3000");
  expect(
    sameOrigin(
      new Request("http://localhost:3000/api/auth/kakao/start", {
        headers: { Origin: "http://127.0.0.1:3000" },
      }),
    ),
  ).toBe(true);
});

it("설정 주소와 다른 출처·포트·프로토콜, 누락 출처를 거부하고 전달 헤더를 신뢰하지 않는다", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://study.example");
  for (const origin of [
    "https://evil.example",
    "http://study.example",
    "https://study.example:444",
    "null",
    "",
  ]) {
    expect(
      sameOrigin(
        new Request("https://evil.example/api/collection/register", {
          headers: {
            ...(origin ? { Origin: origin } : {}),
            Host: "evil.example",
            "X-Forwarded-Host": "evil.example",
          },
        }),
      ),
    ).toBe(false);
  }
});

it("공개 주소 미설정 시 요청 주소를 기준으로 검사하고 잘못된 설정은 거부한다", () => {
  const request = new Request("https://study.example/api/events", {
    headers: { Origin: "https://study.example" },
  });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  expect(sameOrigin(request)).toBe(true);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "invalid-url");
  expect(sameOrigin(request)).toBe(false);
});
