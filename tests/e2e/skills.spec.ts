import { test, expect } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
test("하트로 잠금을 열고 재방문해도 유지하며 로그아웃하면 다시 숨긴다", async ({
  page,
}, info) => {
  const state = await mockSkills(page);
  await page.goto("/methods/cornell");
  await expect(page.locator(".skill-gate h2")).toHaveText("코넬 노트");
  await expect(page.locator(".skill-scene")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "하트 2개 사용해 열기" }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("skill-locked.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "하트 2개 사용해 열기" }).click();
  await expect(page.locator(".skill-scene")).toBeVisible();
  expect(state.progress.balance).toBe(1);
  expect(state.unlocks).toBe(1);
  await expect(
    page.getByRole("button", { name: "지금 10분 해보기" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("skill-open.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator(".skill-scene")).toBeVisible();
  expect(state.unlocks).toBe(1);
  state.signedIn = false;
  await page.reload();
  await expect(page.locator(".skill-gate")).toBeVisible();
  await expect(page.locator(".skill-scene")).toHaveCount(0);
});
test("기존 아이콘과 이름만 표시하고 PC·모바일 모두 확인 팝업을 연다", async ({
  page,
}, info) => {
  const state = await mockSkills(page);
  await page.goto("/methods");
  await expect(page.locator(".skill-tile")).toHaveCount(28);
  await expect(page.locator(".skill-tile[data-unlocked=true]")).toHaveCount(1);
  const card = page.locator(".skill-tile", { hasText: "코넬 노트" });
  await expect(card.locator(".method-original-icon")).toHaveAttribute(
    "src",
    /study-methods%2Fcornell|study-methods\/cornell/,
  );
  await expect(card.locator(".method-mini-lock")).toBeVisible();
  await expect(card.locator("p,.skill-tile-kind")).toHaveCount(0);
  await page.locator("#catalog-memory").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("skill-catalog.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".skill-tile", { hasText: "코넬 노트" }).click();
  const sheet = page.getByRole("dialog", { name: "코넬 노트" });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByText("하트 2개를 사용해 이 스킬을 열까요?"),
  ).toBeVisible();
  await expect(sheet.locator(".skill-scene")).toHaveCount(0);
  await sheet
    .getByRole("button", { name: "다음에 할게요", exact: true })
    .click();
  await expect(sheet).toBeHidden();
  expect(state.unlocks).toBe(0);
  expect(state.progress.balance).toBe(3);
  await expect(card).toBeFocused();
});

for (const [id, cost] of [
  ["blank-page", 1],
  ["cornell", 2],
  ["sq3r", 3],
] as const) {
  test(`하트 ${cost}개 사용 확인 뒤 해당 영상을 재생하고 카드를 공개한다`, async ({
    page,
  }) => {
    const state = await mockSkills(page);
    await page.goto(`/methods/${id}`);
    await expect(page.locator("video.skill-unlock-video")).toHaveCount(0);
    await page
      .getByRole("button", { name: `하트 ${cost}개 사용해 열기` })
      .click();
    const video = page.locator("video.skill-unlock-video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("src", `/skills/unlock-${cost}.mp4`);
    await expect(page.locator(".skill-scene")).toHaveCount(0);
    await expect
      .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
      .toBeGreaterThan(0.1);
    await expect(page.locator(".skill-scene")).toBeVisible({ timeout: 10000 });
    expect(state.unlocks).toBe(1);
    expect(state.progress.balance).toBe(3 - cost);
  });
}

test("영상 오류와 모션 줄이기에서도 이미 해제한 카드는 정상 공개된다", async ({
  page,
}) => {
  const state = await mockSkills(page);
  await page.route("**/skills/unlock-2.mp4", (r) => r.abort());
  await page.goto("/methods/cornell");
  await page.getByRole("button", { name: "하트 2개 사용해 열기" }).click();
  await expect(page.locator(".skill-scene")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/methods/blank-page");
  await page.getByRole("button", { name: "하트 1개 사용해 열기" }).click();
  await expect(page.locator(".skill-scene")).toBeVisible();
  await expect(page.locator("video.skill-unlock-video")).toHaveCount(0);
  expect(state.unlocks).toBe(2);
  expect(state.progress.balance).toBe(0);
});
test("설치된 모바일 앱은 설치 선물을 한 번만 받는다", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "모바일 설치 보상");
  const state = await mockSkills(page);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { get: () => true }),
  );
  await page.goto("/methods");
  await page.getByRole("button", { name: "설치 선물 받기" }).click();
  await expect(
    page.getByText("홈 화면 선물, 하트 3개가 도착했어요!"),
  ).toBeVisible();
  expect(state.progress.balance).toBe(6);
  expect(state.installs).toBe(1);
  await page.reload();
  await expect(page.getByText("설치 선물 받음", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "설치 선물 받기" }),
  ).toHaveCount(0);
});
test("태블릿에서 3열·PC에서 4열로 표시하고 가로 넘침이 없다", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "데스크톱에서 화면 폭 검증");
  await mockSkills(page);
  for (const [width, columns] of [
    [1024, 3],
    [1440, 4],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/methods");
    await expect(page.locator(".skill-tile")).toHaveCount(28);
    expect(
      await page
        .locator(".skill-card-grid")
        .first()
        .evaluate(
          (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(columns);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
