import { afterEach, expect, it, vi } from "vitest";
const session = vi.hoisted(() => ({
  values: new Map<string, string>(),
  account: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => ({ value: session.values.get(key) }),
  }),
}));
vi.mock("@/lib/collection-server", () => ({
  account: session.account,
  AUTH_COOKIE: "session",
}));
import {
  verifiedSdjManager,
  canViewSdjPrizes,
  managerProof,
  MANAGER_COOKIE,
} from "@/lib/sdj-manager";

afterEach(() => {
  session.values.clear();
  vi.unstubAllEnvs();
});
it("지정된 카카오계정의 유효한 인증 이메일만 인정한다", () => {
  const profile = {
    email: "Warmars87@naver.com",
    is_email_verified: true,
    is_email_valid: true,
  };
  expect(verifiedSdjManager(profile)).toBe(true);
  for (const invalid of [
    undefined,
    {},
    { ...profile, email: "other@example.org" },
    { ...profile, is_email_verified: false },
    { ...profile, is_email_valid: false },
  ]) {
    expect(verifiedSdjManager(invalid)).toBe(false);
  }
});
it("인증 결과는 로그인한 세션에만 유효하고 만료되면 접근할 수 없다", async () => {
  vi.stubEnv("AUTH_IDENTITY_HMAC_SECRET", "a".repeat(32));
  session.account.mockResolvedValue({ id: "test" });
  expect(await canViewSdjPrizes()).toBe(false);
  session.values.set("session", "first");
  session.values.set(MANAGER_COOKIE, managerProof("first"));
  expect(await canViewSdjPrizes()).toBe(true);
  session.values.set("session", "second");
  expect(await canViewSdjPrizes()).toBe(false);
  session.values.set(MANAGER_COOKIE, managerProof("second"));
  session.account.mockResolvedValue(null);
  expect(await canViewSdjPrizes()).toBe(false);
});
