import { expect, test } from "@playwright/test";
import { STUDY_TYPES } from "../../src/lib/content";
import { CHARACTERS } from "../../src/lib/characters";
import { CHARACTER_MOTIONS } from "../../src/lib/character-motions";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";

test("루미는 같은 파일을 무음 반복 재생하고 정지·재개·뒤집기를 지원함", async ({
  page,
}) => {
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    if (/generativelanguage|\/api\/.*video/.test(request.url()))
      apiCalls.push(request.url());
  });
  await page.goto("/share/visual-solo-planned");
  const video = page.locator(".character-motion video");
  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => !v.paused && v.readyState >= 2),
    )
    .toBe(true);
  expect(
    await video.evaluate((v: HTMLVideoElement) => ({
      loop: v.loop,
      muted: v.muted,
      inline: v.playsInline,
    })),
  ).toEqual({ loop: true, muted: true, inline: true });
  await expect(video).toHaveAttribute(
    "src",
    "/characters/motion/visual-solo-planned-loop-8s-v1.mp4",
  );
  expect(await video.evaluate((v: HTMLVideoElement) => v.duration)).toBeCloseTo(
    8,
    1,
  );
  const samples = await video.evaluate(
    (v: HTMLVideoElement) =>
      new Promise<number[]>((resolve) => {
        const times: number[] = [];
        const timer = setInterval(() => times.push(v.currentTime), 100);
        setTimeout(
          () => {
            clearInterval(timer);
            resolve(times);
          },
          (v.duration * 2 + 0.5) * 1000,
        );
      }),
  );
  expect(
    samples.filter((time, index) => index > 0 && time < samples[index - 1] - 1)
      .length,
  ).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "루미 움직임 멈추기" }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await expect(page.locator(".character-card")).not.toHaveClass(/is-flipped/);
  await page.getByRole("button", { name: "루미 움직임 재생" }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
  await page
    .getByRole("button", { name: "루미 카드 뒤집어 소개 보기" })
    .click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await page.getByRole("button", { name: "루미 캐릭터 앞면 보기" }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
  expect(apiCalls).toEqual([]);
});

test("동작 줄이기에서는 영상을 요청하지 않고 사용자가 눌렀을 때만 재생함", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/\/characters\/motion\/.*\.mp4$/.test(request.url()))
      requests.push(request.url());
  });
  await page.goto("/share/visual-solo-planned");
  const video = page.locator(".character-motion video");
  await video.scrollIntoViewIfNeeded();
  await expect(page.locator(".character-motion img")).toBeVisible();
  await expect(video).not.toHaveAttribute("src");
  await expect(video).toHaveCSS("opacity", "0");
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "루미 움직임 재생" }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  await page.getByRole("button", { name: "루미 움직임 멈추기" }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
});

test("영상 로딩 실패 시 이미지가 남고 다른 캐릭터의 영상은 정상 재생함", async ({
  page,
}) => {
  await page.route(
    "**/characters/motion/visual-solo-planned-loop-8s-*.mp4",
    (route) => route.abort(),
  );
  await page.goto("/share/visual-solo-planned");
  const video = page.locator(".character-motion video");
  await video.scrollIntoViewIfNeeded();
  await expect(page.locator(".character-motion-toggle")).toHaveCount(0);
  await expect(page.locator(".character-motion img")).toBeVisible();
  await expect(video).toHaveCSS("opacity", "0");
  await page.goto("/share/visual-solo-flexible");
  await expect(page.locator(".character-card")).toHaveCount(1);
  const otherVideo = page.locator(".character-motion video");
  await otherVideo.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      otherVideo.evaluate(
        (v: HTMLVideoElement) => !v.paused && v.readyState >= 2,
      ),
    )
    .toBe(true);
  await expect(otherVideo).toHaveAttribute(
    "src",
    "/characters/motion/visual-solo-flexible-loop-8s-v1.mp4",
  );
});

for (const type of STUDY_TYPES) {
  test(`${CHARACTERS[type.code].name}의 전용 8초 영상이 모바일과 데스크톱에서 재생됨`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const requestedVideos: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (/\/characters\/motion\/.*\.mp4$/.test(request.url()))
        requestedVideos.push(new URL(request.url()).pathname);
    });
    await page.goto(`/share/${type.code}`);
    const video = page.locator(".character-motion video");
    await video.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        video.evaluate((v: HTMLVideoElement) => !v.paused && v.readyState >= 2),
      )
      .toBe(true);
    const asset = CHARACTER_MOTIONS[type.code]!;
    await expect(video).toHaveAttribute("src", asset.video);
    await expect(video).toHaveAttribute("poster", asset.poster);
    await expect(video).toHaveClass("is-ready");
    expect(
      await video.evaluate((v: HTMLVideoElement) => ({
        duration: v.duration,
        loop: v.loop,
        muted: v.muted,
        inline: v.playsInline,
      })),
    ).toEqual({ duration: 8, loop: true, muted: true, inline: true });
    expect(requestedVideos.length).toBeGreaterThan(0);
    expect(requestedVideos.every((path) => path === asset.video)).toBe(true);
    if (type.code === "auditory-solo-flexible") {
      expect(asset.video).toBe(
        "/characters/motion/auditory-solo-flexible-loop-8s-v2.mp4",
      );
      const loops = await video.evaluate(
        (v: HTMLVideoElement) =>
          new Promise<number>((resolve) => {
            let previous = v.currentTime,
              count = 0;
            const timer = setInterval(() => {
              if (v.currentTime < previous - 1) count++;
              previous = v.currentTime;
            }, 100);
            setTimeout(() => {
              clearInterval(timer);
              resolve(count);
            }, 16500);
          }),
      );
      expect(loops).toBeGreaterThanOrEqual(2);
    }
    await page
      .getByRole("button", {
        name: `${CHARACTERS[type.code].name} 움직임 멈추기`,
      })
      .click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("미공개 도감은 영상 파일을 요청하지 않음", async ({ page }) => {
  const videos: string[] = [];
  page.on("request", (request) => {
    if (/\/characters\/motion\/.*\.mp4$/.test(request.url()))
      videos.push(request.url());
  });
  await page.goto("/types");
  await expect(page.locator(".mystery-card")).toHaveCount(16);
  await expect(page.locator("video")).toHaveCount(0);
  await page.locator(".mystery-card").last().scrollIntoViewIfNeeded();
  expect(videos).toEqual([]);
});

test("완성 도감에서 16명의 8초 영상을 표시하고 화면 밖 재생은 멈춤", async ({
  page,
}) => {
  await page.route("**/api/collection", (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        configured: true,
        signedIn: true,
        firstType: STUDY_TYPES[0].code,
        firstRunId: crypto.randomUUID(),
        inviteCode: "ABCDEF1234",
        referralCount: 15,
        cards: STUDY_TYPES.map((type, index) => ({
          code: type.code,
          source: index === 0 ? "first" : "referral",
        })),
      },
    }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await page.route("**/api/collection/special-card*", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.goto("/types");
  const videos = page.locator(".character-gallery .character-motion video");
  await expect(page.locator(".character-gallery .character-card")).toHaveCount(
    16,
  );
  await expect(videos).toHaveCount(16);
  await videos.first().scrollIntoViewIfNeeded();
  await expect
    .poll(() => videos.first().evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  await expect(videos.last()).not.toHaveAttribute("src");
  await videos.last().scrollIntoViewIfNeeded();
  await expect
    .poll(() => videos.last().evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  await expect
    .poll(() => videos.first().evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await expect(videos.last()).toHaveAttribute(
    "src",
    "/characters/motion/motion-team-flexible-loop-8s-v1.mp4",
  );
});

test("화면 밖이나 숨겨진 탭에서는 루미 재생을 멈춤", async ({ page }) => {
  await page.goto("/share/visual-solo-planned");
  const video = page.locator(".character-motion video");
  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    const spacer = document.createElement("div");
    spacer.style.height = "3000px";
    document.body.append(spacer);
    window.scrollTo(0, document.body.scrollHeight);
  });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
});
