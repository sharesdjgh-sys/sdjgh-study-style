import { test, expect, type Page } from "@playwright/test";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import { answersFor } from "../answers";
import { CHARACTERS } from "../../src/lib/characters";

async function seedOwn(
  page: Page,
  code = "visual-solo-planned",
  expired = false,
) {
  await page.goto("/");
  await page.evaluate(
    ({ answers, index, version, code, expired }) => {
      const now = Date.now() - (expired ? 8 * 86400000 : 0);
      localStorage.removeItem("study-style:first-result");
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
          result: code,
          answers,
        }),
      );
    },
    {
      answers: answersFor(code),
      index: QUESTIONS.length - 1,
      version: VERSION,
      code,
      expired,
    },
  );
}

test("미검사 도감은 16명 이름과 고유 카드에 실루엣을 유지함", async ({
  page,
}) => {
  await page.goto("/types");
  await expect(page.locator(".mystery-card")).toHaveCount(16);
  await expect(page.locator(".character-card, .character-back")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "내 캐릭터 만나기 →" }),
  ).toBeVisible();
  const silhouettes = page.locator(".mystery-card img");
  await expect(silhouettes).toHaveCount(16);
  await expect(page.locator(".mystery-card video")).toHaveCount(0);
  for (let i = 0; i < 16; i++) {
    await expect(silhouettes.nth(i)).toHaveCSS("filter", "brightness(0)");
    await expect(silhouettes.nth(i)).toHaveAttribute("alt", "");
  }
  for (const character of Object.values(CHARACTERS)) {
    await expect(
      page
        .locator(".mystery-card")
        .getByRole("heading", { name: character.name, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "운동형", exact: true }).click();
  await expect(page.locator(".mystery-card")).toHaveCount(4);
  await expect(
    page
      .locator(".mystery-card")
      .getByRole("heading", { name: "페이스", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".character-card")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("검사 후 내 카드 한 장만 공개되고 키보드로 뒤집기와 상세 이동 가능", async ({
  page,
}) => {
  await seedOwn(page);
  await page.goto("/types");
  await expect(page.locator(".character-card")).toHaveCount(1);
  await expect(page.locator(".mystery-card")).toHaveCount(15);
  const card = page.locator(".character-card");
  const front = card.locator(".character-front-trigger");
  await expect(
    card.getByRole("heading", { name: "루미", exact: true }),
  ).toBeVisible();
  await expect(card.locator(".character-back")).toHaveAttribute("inert", "");
  await front.focus();
  await front.press("Enter");
  await expect(card).toHaveClass(/is-flipped/);
  await expect(card.locator(".character-front")).toHaveAttribute("inert", "");
  const back = card.getByRole("button", { name: "루미 캐릭터 앞면 보기" });
  await expect(back).toBeFocused();
  await expect(card.getByText("시그니처 공부법 · 목차 공부법")).toBeVisible();
  await back.press("Space");
  await expect(front).toBeFocused();
  await front.click();
  await card.getByRole("link", { name: "더 알아보기" }).click();
  await expect(
    page.getByRole("heading", { name: "차분한 지도 설계자", exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".character-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "루미", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".deck-selector")).toHaveCount(0);
  await page.goto("/types");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(".mystery-card")).toHaveCount(16);
  await expect(page.locator(".character-card")).toHaveCount(0);
});

test("직접 주소와 만료 기록으로 다른 캐릭터의 정체가 공개되지 않음", async ({
  page,
}) => {
  await seedOwn(page);
  await page.goto("/types/motion-team-flexible");
  await expect(page.locator(".mystery-card")).toHaveCount(1);
  await expect(page.locator(".character-card")).toHaveCount(0);
  await expect(page).toHaveTitle(/아직은 비밀/);
  await expect(page.locator('meta[property="og:image"]')).not.toHaveAttribute(
    "content",
    /type=/,
  );
  await seedOwn(page, "visual-solo-planned", true);
  await page.goto("/types");
  await expect(page.locator(".mystery-card")).toHaveCount(16);
  await expect(page.locator(".character-card")).toHaveCount(0);
});

test("친구 공유는 한 캐릭터만 소개하며 내 결과와 도감을 바꾸지 않음", async ({
  page,
}) => {
  await seedOwn(page);
  const before = await page.evaluate(() =>
    localStorage.getItem("study-style:session"),
  );
  await page.goto("/share/motion-team-flexible?from=share");
  await expect(page.locator(".character-card")).toHaveCount(1);
  await expect(page.locator(".character-name")).toHaveText("스킵");
  await expect(page.getByText(/내 검사 결과는 아니에요/)).toBeVisible();
  await page.locator(".character-front-trigger").click();
  await expect(page.locator(".character-card")).toHaveClass(/is-flipped/);
  await expect(page.getByRole("link", { name: "더 알아보기" })).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("study-style:session")),
  ).toBe(before);
  await page.getByRole("link", { name: "다른 친구들의 실루엣 보기" }).click();
  await expect(page.locator(".character-name")).toHaveText("루미");
  await expect(page.locator(".mystery-card")).toHaveCount(15);
  await page.goto("/types/motion-team-flexible?from=share");
  await expect(page).toHaveURL(/\/share\/motion-team-flexible\?from=share$/);
  await expect(page.locator(".character-name")).toHaveText("스킵");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("link", { name: "다른 친구들의 실루엣 보기" }).click();
  await expect(page.locator(".mystery-card")).toHaveCount(16);
  await expect(page.locator(".character-card")).toHaveCount(0);
});

test("결과 링크 복사는 전용 공유 주소를 사용함", async ({ page }) => {
  await seedOwn(page);
  await page.goto("/result");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("clipboard unavailable")),
      },
    });
  });
  await page.getByRole("button", { name: "내 공부캐 링크 복사" }).click();
  await expect(page.getByRole("textbox", { name: "복사할 주소" })).toHaveValue(
    /\/share\/visual-solo-planned\?from=share$/,
  );
});

test("모션 감소 설정에서도 내 카드 앞뒷면 전환과 필터가 동작함", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedOwn(page, "motion-solo-planned");
  await page.goto("/types");
  await page.getByRole("button", { name: "운동형", exact: true }).click();
  await expect(page.locator(".character-card")).toHaveCount(1);
  await expect(page.locator(".mystery-card")).toHaveCount(3);
  const card = page.locator(".character-card");
  await card
    .getByRole("button", { name: "페이스 카드 뒤집어 소개 보기" })
    .click();
  await expect(card.locator(".character-card-inner")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(card.locator(".character-back")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(
    card.getByRole("button", { name: "페이스 캐릭터 앞면 보기" }),
  ).toBeFocused();
});
