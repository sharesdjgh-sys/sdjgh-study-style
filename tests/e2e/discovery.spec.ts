import { test, expect } from "@playwright/test";
import { QUESTIONS, VERSION } from "../../src/lib/content";

test("분석 도중 새로고침해도 완료 결과가 보존됨", async ({ page }) => {
  await page.goto("/quiz");
  await page.evaluate(
    ({ version, questions }) => {
      const now = Date.now();
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({
          version,
          runId: crypto.randomUUID(),
          startedAt: now,
          updatedAt: now,
          source: "direct",
          index: 15,
          choices: {},
          result: null,
          answers: Object.fromEntries(
            questions.map((q) => [
              q.id,
              ["visual", "solo", "planned"].includes(q.axis) ? 5 : 1,
            ]),
          ),
        }),
      );
    },
    { version: VERSION, questions: QUESTIONS },
  );
  await page.reload();
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page.locator(".discovery-shell")).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "내 결과 보기" }).click();
  await expect(
    page.getByRole("heading", { name: "차분한 지도 설계자", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".style-reasons")).toContainText("15점 중 15점");
});

test("동작 줄이기에서도 분석이 완료되고 결과 설명을 읽을 수 있음", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/quiz");
  await page.evaluate(
    ({ version, questions }) => {
      const now = Date.now();
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({
          version,
          runId: crypto.randomUUID(),
          startedAt: now,
          updatedAt: now,
          source: "direct",
          index: 15,
          choices: {},
          result: null,
          answers: Object.fromEntries(
            questions.map((q) => [
              q.id,
              ["auditory", "team", "flexible"].includes(q.axis) ? 5 : 1,
            ]),
          ),
        }),
      );
    },
    { version: VERSION, questions: QUESTIONS },
  );
  await page.reload();
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page.locator(".discovery-shell")).toBeVisible();
  await expect(page.locator(".discovery-progress > span")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page).toHaveURL(/\/result$/);
  await expect(
    page.getByRole("heading", { name: "즉흥적인 이야기 편집자", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".exam-note")).toContainText("예상 질문 3개");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
