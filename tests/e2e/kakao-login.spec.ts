import { expect, test } from "@playwright/test";

for (const scenario of ["talk", "slow-start", "web-fallback"]) {
  test(`iPhone Kakao login: ${scenario}`, async ({ page }, info) => {
    test.skip(info.project.name !== "iphone-webkit", "Exercises iPhone WebKit");
    const state = "server-issued-oauth-state";
    const redirectUri = new URL(
      "/api/auth/kakao/callback",
      String(info.project.use.baseURL),
    ).href;
    const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
    authorize.search = new URLSearchParams({
      state,
      redirect_uri: redirectUri,
    }).toString();
    await page.addInitScript((slow) => {
      Object.defineProperty(AbortSignal, "any", { value: undefined });
      Object.defineProperty(AbortSignal, "timeout", { value: undefined });
      Object.defineProperty(navigator, "userActivation", {
        value: { isActive: !slow },
      });
    }, scenario === "slow-start");
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({ json: { signedIn: false, configured: true } }),
    );
    let starts = 0;
    await page.route("**/api/auth/kakao/start?*", (route) => {
      starts++;
      return route.fulfill({ json: { authorizationUrl: authorize.href } });
    });
    await page.route("https://t1.kakaocdn.net/**", (route) =>
      scenario === "web-fallback"
        ? route.abort()
        : route.fulfill({
            contentType: "application/javascript",
            body: "window.Kakao = { isInitialized: () => true, Auth: { authorize(params) { window.sessionStorage.setItem('sdk-args', JSON.stringify(params)); } } };",
          }),
    );
    await page.route("https://kauth.kakao.com/**", (route) =>
      route.fulfill({ body: "Account login" }),
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const login = page
      .getByRole("banner")
      .getByRole("button", { name: "카카오 로그인", exact: true });
    if (scenario !== "web-fallback")
      await page.waitForFunction(() => Boolean(window.Kakao));
    await login.click();
    if (scenario === "slow-start") {
      await expect(page.getByRole("banner")).toContainText("한 번 더");
      await login.click();
    }
    if (scenario === "web-fallback") {
      await expect(page).toHaveURL(authorize.href);
    } else {
      await expect
        .poll(() =>
          page.evaluate(() =>
            JSON.parse(sessionStorage.getItem("sdk-args") ?? "null"),
          ),
        )
        .toEqual({ state, redirectUri });
    }
    expect(starts).toBe(1);
  });
}
