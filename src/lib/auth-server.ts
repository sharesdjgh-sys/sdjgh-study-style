import { createHmac } from "node:crypto";

export function identityKeyConfigured() {
  return (process.env.AUTH_IDENTITY_HMAC_SECRET?.length ?? 0) >= 32;
}

export function identityHash(kakaoId: string) {
  if (!identityKeyConfigured()) throw new Error("identity_key_not_configured");
  return createHmac("sha256", process.env.AUTH_IDENTITY_HMAC_SECRET!)
    .update(`kakao:${kakaoId}`)
    .digest("hex");
}

/** Stage names are fixed by the caller; never log tokens, identities or bodies. */
export async function timedAuth<T>(
  stage: string,
  operation: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    return await operation();
  } finally {
    if (process.env.NODE_ENV !== "test")
      console.info(
        JSON.stringify({
          event: "auth_timing",
          stage,
          durationMs: Math.round(performance.now() - started),
        }),
      );
  }
}
