import { test, expect } from "@playwright/test";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";

test("미리보기는 실루엣을 섞고 선택한 캐릭터를 공개하며 다시 재생할 수 있음", async ({
  page,
}) => {
  await page.goto("/preview/discovery");
  await page.locator("select").selectOption("motion-team-flexible");
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.getByRole("button", { name: "등장 연출 보기" }).click();
  const active = page.locator(".discovery-frame.is-current img");
  const first = await active.getAttribute("src");
  await expect.poll(() => active.getAttribute("src")).not.toBe(first);
  await expect(page.locator(".discovery-frame.is-current")).toHaveCount(1);
  await expect(page.locator(".discovery-revealed")).toHaveCount(0);
  await expect(page.locator(".discovery-reel-label")).toHaveText("스킵");
  await expect(page.locator(".discovery-revealed")).toHaveAttribute(
    "src",
    /motion-team-flexible/,
  );
  await expect(page.locator(".character-name")).toHaveText("스킵");
  await page.getByRole("button", { name: "처음부터 다시 보기" }).click();
  await expect(page.locator(".discovery-shell")).toHaveAttribute(
    "data-stage",
    "0",
  );
  await expect(page.locator(".character-name")).toHaveText("스킵");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});

test("분석 도중 새로고침해도 완료 결과가 보존됨", async ({ page }) => {
  await page.goto("/quiz");
  await page.evaluate(
    ({ version, answers, index }) => {
      const now = Date.now();
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({
          version,
          runId: crypto.randomUUID(),
          startedAt: now,
          updatedAt: now,
          source: "direct",
          index,
          choices: {},
          result: null,
          answers,
        }),
      );
    },
    {
      version: VERSION,
      answers: answersFor("visual-solo-planned"),
      index: QUESTIONS.length - 1,
    },
  );
  await page.reload();
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page.locator(".discovery-shell")).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "내 결과 보기" }).click();
  await expect(
    page.getByRole("heading", { name: "차분한 지도 설계자", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".style-reasons")).toContainText(
    "12가지 상황 중 12번",
  );
});

test("동작 줄이기에서도 분석이 완료되고 결과 설명을 읽을 수 있음", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/quiz");
  await page.evaluate(
    ({ version, answers, index }) => {
      const now = Date.now();
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({
          version,
          runId: crypto.randomUUID(),
          startedAt: now,
          updatedAt: now,
          source: "direct",
          index,
          choices: {},
          result: null,
          answers,
        }),
      );
    },
    {
      version: VERSION,
      answers: answersFor("auditory-team-flexible"),
      index: QUESTIONS.length - 1,
    },
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
