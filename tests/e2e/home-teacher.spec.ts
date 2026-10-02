import { test, expect } from "@playwright/test";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";

test("작은 토리 가이드와 랜덤 실루엣이 함께 공부캐 찾기로 안내함", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const videoRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("teacher-tori-guide-transparent.webp"))
      videoRequests.push(request.url());
  });
  await page.goto("/");
  const teacher = page.getByRole("img", {
    name: "손을 흔들며 공부캐 찾기를 안내하는 토리 선생님",
  });
  await expect(teacher).toBeVisible();
  await expect
    .poll(() =>
      teacher.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  expect((await teacher.boundingBox())!.width).toBeLessThanOrEqual(112);
  await expect(page.locator(".mystery-carousel")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const card = page.locator(".mystery-carousel .mystery-card");
  const first = await card.getAttribute("aria-label");
  await page.getByRole("button", { name: "다음 실루엣 보기" }).click();
  await expect(card).not.toHaveAttribute("aria-label", first!);
  await expect(page.locator(".hero-teacher-avatar video")).toHaveCount(0);
  expect(
    await teacher.evaluate((img: HTMLImageElement) => img.currentSrc),
  ).toContain("transparent-poster.webp");
  expect(videoRequests).toHaveLength(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".hero-actions")
    .getByRole("link", { name: "내 공부캐 찾기" })
    .click();
  await expect(page).toHaveURL(/\/quiz$/);
});

test("안내 문구 앞 토리는 배경과 버튼 없이 반복 애니메이션으로 표시됨", async ({
  page,
}) => {
  await page.goto("/");
  const avatar = page.locator(".hero-teacher-avatar");
  const guide = page.locator(".hero-teacher-guide > div").last();
  const image = avatar.locator("img");
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const box = (await avatar.boundingBox())!;
  const copy = (await guide.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(copy.x);
  expect(box.width).toBeLessThanOrEqual(112);
  await expect(avatar.locator("button, video")).toHaveCount(0);
  await expect(avatar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect(
    await image.evaluate((img: HTMLImageElement) => img.currentSrc),
  ).toContain("teacher-tori-guide-transparent.webp");
  const firstFrame = await avatar.screenshot();
  await expect
    .poll(async () => (await avatar.screenshot()).equals(firstFrame))
    .toBe(false);
  await expect(page.locator(".mystery-carousel")).toBeVisible();
});

test("이미 발견한 첫 공부캐는 히어로에서 다시 만날 수 있음", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ answers, version, index }) => {
      const now = Date.now();
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({
          version,
          runId: crypto.randomUUID(),
          startedAt: now,
          updatedAt: now,
          completedAt: now,
          source: "direct",
          index,
          choices: {},
          result: "visual-solo-planned",
          answers,
        }),
      );
    },
    {
      answers: answersFor("visual-solo-planned"),
      version: VERSION,
      index: QUESTIONS.length - 1,
    },
  );
  await page.reload();
  await expect(page.locator(".hero-character-card")).toBeVisible();
  await expect(page.locator(".hero-character-card")).toContainText("루미");
  await expect(
    page.getByRole("link", { name: "내 공부캐 다시 보기" }),
  ).toHaveAttribute("href", "/result");
});
