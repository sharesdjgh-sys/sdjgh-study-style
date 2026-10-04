import { test, expect } from "@playwright/test";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";
import { acceptQuizIntro } from "../quiz";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: { signedIn: false, configured: true, results: [], code: null },
    }),
  );
});

test("재검사는 이전 동의를 재사용하지 않고 동의 전 시작 이벤트를 보내지 않는다", async ({
  page,
}) => {
  const runId = crypto.randomUUID();
  await page.addInitScript(
    ({ runId, version, answers, index }) => {
      const now = Date.now();
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({
          version,
          runId,
          source: "direct",
          startedAt: now,
          updatedAt: now,
          completedAt: now,
          index,
          choices: {},
          answers,
          result: "visual-solo-planned",
        }),
      );
      sessionStorage.setItem(
        "study-style:quiz-consent",
        `${version}:intro-v1:${runId}`,
      );
    },
    {
      runId,
      version: VERSION,
      answers: answersFor("visual-solo-planned"),
      index: QUESTIONS.length - 1,
    },
  );
  let events = 0;
  await page.route("**/api/events", (route) => {
    events++;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/quiz");
  await page
    .getByRole("button", { name: "다시 검사하기", exact: true })
    .click();
  await page.getByRole("button", { name: "새로 시작", exact: true }).click();
  await expect(page.getByRole("button", { name: /동의하고/ })).toBeDisabled();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  expect(events).toBe(0);
  await acceptQuizIntro(page);
  await expect(page.locator(".question-number")).toHaveText("질문 01");
  await expect.poll(() => events).toBeGreaterThan(0);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("study-style:session")!),
  );
  expect(saved.runId).not.toBe(runId);
  expect(saved.isRetake).toBe(true);
});

test("질문·선택지 가독성과 안내 펼치기, 답변 복구부터 최종 선택까지 검증한다", async ({
  page,
  isMobile,
}, info) => {
  await page.goto("/quiz");
  await expect(page.getByRole("button", { name: /동의하고/ })).toBeDisabled();
  await expect(page.locator(".question-card")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("study-style:session")),
  ).toBeNull();
  await expect(page.getByText(/성격·능력을 진단하거나/)).toBeVisible();
  await page.screenshot({
    path: info.outputPath("quiz-consent.png"),
    fullPage: true,
  });
  await acceptQuizIntro(page);
  await expect(page.locator(".question-card h1")).toHaveText(QUESTIONS[0].text);
  const homeLogo = page.locator(".quiz-top > a");
  await expect(homeLogo).toHaveAttribute("href", "/");
  await expect(homeLogo.locator("img")).toHaveCount(2);
  if (isMobile) await expect(homeLogo).toBeVisible();
  else await expect(homeLogo).toBeHidden();
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
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(
    page.locator(".question-card .quiz-signature img"),
  ).toBeVisible();
  const pairIndex = QUESTIONS.findIndex((q) => q.kind === "pair");
  let previousAnchors:
    { controls: number; logo: number; options: number } | undefined;
  for (let i = 1; i < QUESTIONS.length; i++) {
    await expect(page.locator(".question-card h1")).toHaveText(
      QUESTIONS[i].text,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (isMobile) {
      const anchors = await page.evaluate(() => {
        const controls = document
          .querySelector(".quiz-controls")!
          .getBoundingClientRect();
        const options = document
          .querySelector(".quiz-question-body > fieldset")!
          .getBoundingClientRect();
        const logo = document
          .querySelector(".quiz-signature img")!
          .getBoundingClientRect();
        return {
          controls: controls.top,
          logo: logo.top,
          options: options.bottom,
        };
      });
      expect(
        anchors.controls - anchors.options,
        `question ${i + 1}: choice-to-button gap`,
      ).toBeLessThanOrEqual(16);
      if (previousAnchors) {
        for (const key of ["controls", "logo", "options"] as const)
          expect(
            Math.abs(anchors[key] - previousAnchors[key]),
            `question ${i + 1}: stable ${key}`,
          ).toBeLessThanOrEqual(1);
      }
      previousAnchors = anchors;
      const layout = await page.evaluate(() => {
        const body = document.querySelector(".quiz-question-body")!;
        const controls = document
          .querySelector(".quiz-controls")!
          .getBoundingClientRect();
        const logo = document
          .querySelector(".quiz-signature img")!
          .getBoundingClientRect();
        return {
          contentFits: body.scrollHeight <= body.clientHeight + 1,
          controlsFit: controls.top >= 0 && controls.bottom <= innerHeight,
          noOverlap: controls.bottom < logo.top,
          logoFits: logo.top >= 0 && logo.bottom <= innerHeight,
          pageFits:
            document.querySelector(".quiz-active")!.getBoundingClientRect()
              .bottom <=
            innerHeight + 1,
        };
      });
      expect(layout, `question ${i + 1}`).toEqual({
        contentFits: true,
        controlsFit: true,
        noOverlap: true,
        logoFits: true,
        pageFits: true,
      });
    }
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

test("브라우저 저장이 차단되어도 동의 후 답변을 진행할 수 있다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await page.goto("/quiz");
  await acceptQuizIntro(page);
  await expect(page.getByRole("status")).toContainText(
    "답변은 이 창에서만 유지돼요",
  );
  await page.locator(".situation-option input").first().check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await expect(page.locator(".question-number")).toHaveText("질문 02");
});

test("320px 화면과 확대된 글자에서도 문장과 선택지가 잘리지 않는다", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/quiz");
  await acceptQuizIntro(page);
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
  expect(
    await page
      .locator(".quiz-controls")
      .evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight),
  ).toBe(true);
  expect(
    await page
      .locator(".quiz-signature img")
      .evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight),
  ).toBe(true);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("quiz-narrow.png"),
    fullPage: true,
  });
});
