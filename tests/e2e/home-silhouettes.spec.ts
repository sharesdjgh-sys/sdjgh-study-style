import { test, expect } from "@playwright/test";

test("홈 실루엣은 매 바퀴 16명 모두 중복 없이 등장하고 경계에서도 반복하지 않음", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".mystery-carousel")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const card = page.locator(".mystery-carousel .mystery-card");
  let previous: string | null = null;
  for (let round = 0; round < 2; round++) {
    const seen = new Set<string>();
    for (let i = 0; i < 16; i++) {
      const label = (await card.getAttribute("aria-label"))!;
      expect(label).not.toBe(previous);
      seen.add(label);
      previous = label;
      await expect(card.locator("img")).toHaveCSS("filter", "brightness(0)");
      await expect(card.locator("h2")).toHaveText("???");
      await page.getByRole("button", { name: "다음 실루엣 보기" }).click();
    }
    expect(seen.size).toBe(16);
  }
  await expect(page.locator(".hero-character-visual video")).toHaveCount(0);
});

test("홈 실루엣 자동 전환을 멈췄다가 다시 시작할 수 있음", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".mystery-carousel")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const card = page.locator(".mystery-carousel .mystery-card");
  const first = await card.getAttribute("aria-label");
  await expect(card).not.toHaveAttribute("aria-label", first!);
  await page
    .locator(".deck-selector")
    .getByRole("button", { name: "잠시 멈추기" })
    .click();
  const paused = await card.getAttribute("aria-label");
  await page.clock.install();
  await page.clock.runFor(6000);
  await expect(card).toHaveAttribute("aria-label", paused!);
  await page
    .locator(".deck-selector")
    .getByRole("button", { name: "자동 넘김 시작" })
    .click();
  await page.clock.runFor(4100);
  await expect(card).not.toHaveAttribute("aria-label", paused!);
});

test("동작 줄이기에서는 자동 전환 없이 수동으로 실루엣을 볼 수 있음", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".mystery-carousel")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const card = page.locator(".mystery-carousel .mystery-card");
  const first = await card.getAttribute("aria-label");
  await page.clock.install();
  await page.clock.runFor(6000);
  await expect(card).toHaveAttribute("aria-label", first!);
  await expect(card.locator("img")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "다음 실루엣 보기" }).click();
  await expect(card).not.toHaveAttribute("aria-label", first!);
});

test("하단 실루엣은 버튼 없이 자동 전환되고 테스트로 이동할 수 있음", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const closing = page.locator(".closing-reveal");
  await closing.scrollIntoViewIfNeeded();
  await expect(closing.locator(".silhouette-preview")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const image = closing.locator(".silhouette-stage img");
  await expect(image).toHaveCSS("filter", "brightness(0)");
  await expect(image).toHaveCSS("animation-name", "none");
  await expect(closing.locator(".mystery-card")).toHaveCount(0);
  await expect(closing.getByRole("button")).toHaveCount(0);
  const first = await image.getAttribute("src");
  await page.clock.install();
  await page.clock.runFor(6000);
  await expect(image).toHaveAttribute("src", first!);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.runFor(4100);
  await expect(image).not.toHaveAttribute("src", first!);
  await closing.getByRole("link", { name: "내 공부캐 카드 만나기" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
});
