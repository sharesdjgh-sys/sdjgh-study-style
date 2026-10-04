import { test, expect, type Page } from "@playwright/test";
import {
  STUDY_TYPES,
  SITUATIONS,
  VERSION,
  QUESTIONS,
} from "../../src/lib/content";
import { CHARACTERS } from "../../src/lib/characters";
import { answersFor } from "../answers";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import type { Session } from "../../src/lib/storage";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

test("루미의 고정 디자인은 같고 학생별 점수 영역만 달라진다", async ({
  page,
}) => {
  await mockGuest(page);
  await page.goto("/");
  const images: Buffer[] = [];
  for (const onlyVisual of [false, true]) {
    const s = session("visual-solo-planned");
    if (onlyVisual) s.answers = answersFor("visual-solo-planned");
    await page.evaluate((s) => {
      localStorage.setItem("study-style:session", JSON.stringify(s));
      localStorage.setItem("study-style:first-result", JSON.stringify(s));
    }, s);
    await page.goto("/result");
    const inline = page.locator(".keepsake-inline-open img");
    await expect(inline).toBeVisible();
    await expect(inline).toHaveAttribute("src", /^blob:/);
    const inlineSource = await inline.getAttribute("src");
    await page
      .locator(".keepsake-section")
      .screenshot({ path: test.info().outputPath("inline-card.png") });
    await expect(
      page.getByText("9:16 세로 이미지 · 1080 × 1920 PNG", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true })
      .click();
    await expect(page.locator(".keepsake-preview")).toHaveAttribute(
      "alt",
      onlyVisual
        ? /시각형 100%, 청각형 0%, 촉각형 0%, 운동형 0%/
        : /시각형 50%, 청각형 25%, 촉각형 17%, 운동형 8%/,
    );
    await expect(page.locator(".keepsake-preview")).toHaveAttribute(
      "src",
      inlineSource!,
    );
    await page.screenshot({ path: test.info().outputPath("card-dialog.png") });
    const pending = page.waitForEvent("download");
    await page.getByRole("link", { name: "PNG 저장", exact: true }).click();
    images.push(await readFile((await (await pending).path())!));
  }
  expect(images[0].equals(images[1])).toBe(false);
  for (const region of [
    { left: 0, top: 0, width: 1080, height: 1450 },
    { left: 0, top: 1655, width: 1080, height: 265 },
  ]) {
    const [before, after] = await Promise.all(
      images.map((image) => sharp(image).extract(region).raw().toBuffer()),
    );
    expect(before.equals(after)).toBe(true);
  }
});

function session(code: string): Session {
  const answers = answersFor(code);
  const rest = ["visual", "auditory", "tactile", "motion"].filter(
    (m) => m !== code.split("-")[0],
  );
  SITUATIONS.forEach((q, i) => {
    if (i >= 6)
      answers[q.id] = rest[
        i < 9 ? 0 : i < 11 ? 1 : 2
      ] as (typeof answers)[string];
  });
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    source: "direct",
    startedAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: Date.now(),
    index: QUESTIONS.length - 1,
    choices: {},
    result: code,
    answers,
  };
}
async function mockGuest(page: Page) {
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({ json: EMPTY_COLLECTION }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
}
test("16종 전용 카드에 실제 응답을 합성하고 1080×1920 PNG를 저장한다", async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  await mockGuest(page);
  await page.goto("/");
  for (const type of STUDY_TYPES) {
    const s = session(type.code);
    await page.evaluate((s) => {
      localStorage.setItem("study-style:session", JSON.stringify(s));
      localStorage.setItem("study-style:first-result", JSON.stringify(s));
    }, s);
    await page.goto("/result");
    await page
      .getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true })
      .click();
    const preview = page.locator(".keepsake-preview");
    await expect(preview).toBeVisible({ timeout: 25000 });
    await expect(preview).toHaveAttribute(
      "alt",
      new RegExp(`${CHARACTERS[type.code].name}.*50%`),
    );
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "PNG 저장", exact: true }).click();
    const download = await downloadPromise;
    const path = testInfo.outputPath(`${type.code}.png`);
    await download.saveAs(path);
    const metadata = await sharp(path).metadata();
    expect([metadata.width, metadata.height, metadata.format]).toEqual([
      1080,
      1920,
      "png",
    ]);
    await page.getByRole("button", { name: "카드 미리보기 닫기" }).click();
    await expect(
      page.getByRole("button", {
        name: "내 공부캐 이미지로 저장",
        exact: true,
      }),
    ).toBeFocused();
  }
});
test("계정 결과는 빈 기기에서 7일 뒤에도 복원되고 로그아웃하면 사라진다", async ({
  page,
}) => {
  const s = session("visual-solo-planned");
  const old = 30 * 86400000;
  s.startedAt -= old;
  s.updatedAt -= old;
  s.completedAt! -= old;
  let signedIn = true;
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({
      json: signedIn
        ? {
            ...EMPTY_COLLECTION,
            signedIn: true,
            accountId: "account-a",
            firstRunId: s.runId,
            firstType: s.result,
            cards: [{ code: s.result, source: "first" }],
          }
        : EMPTY_COLLECTION,
    }),
  );
  await page.route("**/api/results", (route) =>
    route.fulfill({ json: { results: signedIn ? [s] : [] } }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await page.goto("/collection");
  const history = page.getByRole("region", { name: "계정에 저장한 검사 결과" });
  await history.getByRole("link").click();
  await expect(
    page.getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".score-bars")).toContainText("6 / 12");
  expect(
    await page.evaluate(() => localStorage.getItem("study-style:session")),
  ).toBeNull();
  signedIn = false;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "아직 불러올 검사 결과가 없어요." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true }),
  ).toHaveCount(0);
});
test("원화 로딩 실패는 재시도할 수 있고 재검사는 잠긴 캐릭터를 내보내지 않는다", async ({
  page,
}) => {
  await mockGuest(page);
  await page.goto("/");
  const s = session("tactile-solo-flexible");
  await page.evaluate(
    (s) => localStorage.setItem("study-style:session", JSON.stringify(s)),
    s,
  );
  let fail = true;
  await page.route(
    "**/result-cards/tactile-solo-flexible-fixed-v2.webp",
    (route) => (fail ? route.abort() : route.continue()),
  );
  await page.goto("/result");
  await page
    .getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "카드 그림을 불러오지 못했어요",
  );
  fail = false;
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "다시 만들기" })
    .click();
  await expect(page.locator(".keepsake-preview")).toBeVisible();
  await page.getByRole("button", { name: "카드 미리보기 닫기" }).click();
  await page.evaluate(
    (s) =>
      localStorage.setItem(
        "study-style:session",
        JSON.stringify({ ...s, isRetake: true }),
      ),
    s,
  );
  await page.reload();
  await expect(page.locator(".result-character .mystery-card")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "내 공부캐 이미지로 저장", exact: true }),
  ).toHaveCount(0);
});
