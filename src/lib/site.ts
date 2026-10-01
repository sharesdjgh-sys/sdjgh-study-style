export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export function sameOrigin(request: Request) {
  try {
    // Next.js can normalize 127.0.0.1 to localhost internally. The configured
    // public origin is the browser-facing address, including its protocol/port.
    const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
      .origin;
    return request.headers.get("origin") === expected;
  } catch {
    return false;
  }
}
