import { test, expect } from "@playwright/test";
import { QUESTIONS } from "../../src/lib/content";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: { signedIn: false, configured: true, results: [], code: null },
    }),
  );
});

test("질문·선택지 가독성과 안내 펼치기, 답변 복구부터 최종 선택까지 검증한다", async ({
  page,
  isMobile,
}, info) => {
  await page.goto("/quiz");
  await expect(page.locator(".question-card h1")).toHaveText(QUESTIONS[0].text);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("quiz-first.png"),
    fullPage: true,
  });
  const titleStyle = await page
    .locator(".question-card h1")
    .evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        ratio: parseFloat(css.lineHeight) / parseFloat(css.fontSize),
        font: css.fontFamily,
      };
    });
  expect(titleStyle.ratio).toBeCloseTo(isMobile ? 1.4 : 1.55, 2);
  expect(titleStyle.font).toContain("Cafe24 Ssurround");
  expect(
    await page
      .locator(".situation-option")
      .first()
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await page.getByText("시작 전에 알아두세요", { exact: false }).click();
  await expect(
    page.getByText(/성격·능력을 진단하는 검사가 아니에요/),
  ).toBeVisible();
  await page.getByText("시작 전에 알아두세요", { exact: false }).click();
  await page.locator(".question-guide summary").click();
  await expect(page.locator(".question-guide p")).toBeVisible();
  await page.locator(".question-guide summary").click();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await expect(page.locator(".question-card [role=alert]")).toHaveText(
    "답을 하나 골라주세요.",
  );
  await page.locator(".situation-option input").first().focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".situation-option input").first()).toBeChecked();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "이전", exact: true }).click();
  await expect(page.locator(".situation-option input").first()).toBeChecked();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.reload();
  const pairIndex = QUESTIONS.findIndex((q) => q.kind === "pair");
  for (let i = 1; i < QUESTIONS.length; i++) {
    await expect(page.locator(".question-card h1")).toHaveText(
      QUESTIONS[i].text,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (QUESTIONS[i].kind === "situation")
      await page.locator(".situation-option input").first().check();
    else
      await page
        .getByRole("radio", { name: "위 문장에 훨씬 가까워요", exact: true })
        .check();
    if (i === pairIndex) {
      await expect(page.locator(".pair-card.chosen")).toHaveCount(1);
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: info.outputPath("quiz-pair.png"),
        fullPage: true,
      });
    }
    await page
      .getByRole("button", {
        name: i === QUESTIONS.length - 1 ? "내 결과 보기" : "다음 질문",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".tie-choice")).toHaveCount(4);
  await page.screenshot({
    path: info.outputPath("quiz-tie.png"),
    fullPage: true,
  });
  await page.locator(".tie-choice input").first().check();
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page).toHaveURL(/\/result$/, { timeout: 15000 });
  await expect(page.locator(".result-character .character-card")).toBeVisible();
});

test("320px 화면과 확대된 글자에서도 문장과 선택지가 잘리지 않는다", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/quiz");
  await expect(page.locator(".question-card h1")).toBeVisible();
  await page.addStyleTag({ content: "html { font-size: 20px; }" });
  expect(
    await page
      .locator(".situation-option")
      .first()
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(20);
  const pairIndex = QUESTIONS.findIndex((q) => q.kind === "pair");
  for (let i = 0; i <= pairIndex; i++) {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (i < pairIndex) {
      await page.locator(".situation-option input").first().check();
      await page.getByRole("button", { name: "다음 질문" }).click();
    }
  }
  for (const input of await page.locator(".pair-choice input").all()) {
    await input.check();
    await expect(input).toBeChecked();
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("quiz-narrow.png"),
    fullPage: true,
  });
});
