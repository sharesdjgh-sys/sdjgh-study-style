import { test, expect } from "@playwright/test";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";

for (const width of [768, 820, 1024, 1440]) {
  test(`웹앱 상단 메뉴 ${width}px: 아이콘·선택 상태·페이지 이동`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({ json: { signedIn: false, configured: true } }),
    );
    await page.goto("/");
    const nav = page.getByRole("navigation", {
      name: "주요 메뉴",
      exact: true,
    });
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(nav.getByRole("link", { name: "내 캐 찾기" })).toHaveAttribute(
      "href",
      "/quiz",
    );
    for (const [label, path] of [
      ["공부캐 도감", "/types"],
      ["공부 스킬북", "/methods"],
      ["내 정보", "/account"],
      ["내 캐 찾기", "/quiz"],
    ]) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(nav.locator('[aria-current="page"]')).toHaveText(label);
      await expect
        .poll(() =>
          nav
            .locator("img")
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      const layout = await nav.getByRole("link").evaluateAll((links) =>
        links.map((link) => {
          const rect = link.getBoundingClientRect();
          const image = link.querySelector("img")!;
          return {
            visible: rect.width > 0 && rect.height >= 44,
            fits: rect.x >= 0 && rect.right <= innerWidth,
            loaded: image.complete && image.naturalWidth > 0,
          };
        }),
      );
      expect(
        layout.every((item) => item.visible && item.fits && item.loaded),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`${path.slice(1)}.png`),
      });
    }
  });
}

test("검사 완료·기록 삭제 후 PC와 모바일 메뉴 목적지가 갱신된다", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: { signedIn: false, configured: true } }),
  );
  await page.goto("/");
  const nav = page.getByRole("navigation", {
    name: isMobile ? "빠른 메뉴" : "주요 메뉴",
    exact: true,
  });
  await expect(nav.getByRole("link", { name: "내 캐 찾기" })).toBeVisible();
  const now = Date.now();
  const session = {
    version: VERSION,
    runId: crypto.randomUUID(),
    source: "direct",
    startedAt: now,
    updatedAt: now,
    completedAt: now,
    answers: answersFor("visual-solo-planned"),
    choices: {},
    index: QUESTIONS.length - 1,
    result: "visual-solo-planned",
  };
  await page.evaluate((saved) => {
    localStorage.setItem("study-style:session", JSON.stringify(saved));
    localStorage.setItem("study-style:first-result", JSON.stringify(saved));
  }, session);
  await nav.getByRole("link", { name: "공부캐 도감", exact: true }).click();
  await expect(
    nav.getByRole("link", { name: "내 결과", exact: true }),
  ).toHaveAttribute("href", "/result");
  await nav.getByRole("link", { name: "내 결과", exact: true }).click();
  await expect(page).toHaveURL(/\/result$/);
  await expect(
    nav.getByRole("link", { name: "내 결과", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "공부캐 도감", exact: true }).click();
  await page.evaluate(() => {
    localStorage.removeItem("study-style:session");
    localStorage.removeItem("study-style:first-result");
    window.dispatchEvent(new Event("study-style:records-cleared"));
  });
  await expect(
    nav.getByRole("link", { name: "내 캐 찾기", exact: true }),
  ).toHaveAttribute("href", "/quiz");
});
