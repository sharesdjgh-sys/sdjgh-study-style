import { test, expect, type Page } from "@playwright/test";
import { acceptQuizIntro } from "../quiz";
import { QUESTIONS, VERSION } from "../../src/lib/content";
import {
  EMPTY_COLLECTION,
  type CollectionData,
} from "../../src/lib/collection-contract";
import { answersFor } from "../answers";
import type { Session } from "../../src/lib/storage";

function complete(): Session {
  const now = Date.now();
  return {
    version: VERSION,
    runId: crypto.randomUUID(),
    source: "direct",
    startedAt: now,
    updatedAt: now,
    completedAt: now,
    index: QUESTIONS.length - 1,
    choices: {},
    result: "visual-solo-planned",
    answers: answersFor("visual-solo-planned"),
  };
}

test("기기 기록 삭제는 현재 화면을 초기화하고 계정 결과 유지 여부를 안내한다", async ({
  page,
}) => {
  const first = complete();
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({
      json: { ...EMPTY_COLLECTION, signedIn: true, accountId: "device-clear" },
    }),
  );
  await page.route("**/api/results", (route) =>
    route.fulfill({ json: { results: [first] } }),
  );
  await visit(page, "/");
  await page.evaluate((s) => {
    localStorage.setItem("study-style:session", JSON.stringify(s));
    localStorage.setItem("study-style:first-result", JSON.stringify(s));
  }, first);
  await visit(page, "/result");
  await expect(page.locator(".character-name")).toHaveText("루미");
  await expect(
    page.getByRole("button", { name: /기록.*삭제|기록 지우기/ }),
  ).toHaveCount(0);
  await visit(page, "/privacy");
  await page
    .getByRole("button", { name: "이 브라우저의 검사 기록 삭제", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "기록 삭제", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "이 브라우저의 검사 기록을 지웠어요." }),
  ).toContainText("계정에 저장된 검사 결과와 도감은 유지돼요.");
  expect(
    await page.evaluate(() => [
      localStorage.getItem("study-style:session"),
      localStorage.getItem("study-style:first-result"),
    ]),
  ).toEqual([null, null]);
  await visit(page, "/result");
  await expect(page.locator(".character-name")).toHaveText("루미");
});

test("계정 삭제 후 다른 탭의 옛 결과도 사라지고 새 계정에 재전송하지 않는다", async ({
  page,
  context,
}) => {
  const first = complete();
  let data: CollectionData = {
    ...EMPTY_COLLECTION,
    configured: true,
    signedIn: true,
    accountId: "old-account",
    firstType: first.result,
    firstRunId: first.runId,
  };
  let stored = [first];
  const posted: string[] = [];
  await context.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({ json: data }),
  );
  await context.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await context.route("**/api/results", (route) => {
    if (route.request().method() === "POST") {
      posted.push((route.request().postDataJSON() as Session).runId);
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { results: stored } });
  });
  await context.route("**/api/collection/account", (route) => {
    data = { ...data, signedIn: false, firstType: null, firstRunId: null };
    stored = [];
    return route.fulfill({ json: { ok: true } });
  });
  await visit(page, "/");
  await page.evaluate((s) => {
    localStorage.setItem("study-style:session", JSON.stringify(s));
    localStorage.setItem("study-style:first-result", JSON.stringify(s));
  }, first);
  const other = await context.newPage();
  await visit(other, "/result");
  await expect(other.locator(".character-name")).toHaveText("루미");
  await visit(page, "/collection");
  await page
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "계정·도감 삭제", exact: true })
    .click();
  await expect(
    other.getByRole("heading", { name: "아직 불러올 검사 결과가 없어요." }),
  ).toBeVisible();
  expect(
    await other.evaluate(() => [
      localStorage.getItem("study-style:session"),
      localStorage.getItem("study-style:first-result"),
    ]),
  ).toEqual([null, null]);
  data = { ...data, signedIn: true, accountId: "new-account" };
  await other.reload();
  await expect(
    other.getByRole("region", { name: "계정에 저장한 검사 결과" }),
  ).toContainText("아직 계정에 저장한 검사 결과가 없어요.");
  expect(posted).toEqual([]);
  await visit(other, "/quiz");
  await acceptQuizIntro(other);
  await expect(other.locator(".question-number")).toHaveText("질문 01");
  const next = await other.evaluate(() =>
    JSON.parse(localStorage.getItem("study-style:session")!),
  );
  expect(next.runId).not.toBe(first.runId);
  expect(next.isRetake).toBe(false);
  expect(next.answers).toEqual({});
});

test("도감 등록 전이어도 계정에 첫 검사가 있으면 다른 결과는 재검사로 처리한다", async ({
  page,
}) => {
  const first = complete();
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({
      json: { ...EMPTY_COLLECTION, signedIn: true, accountId: "saved-only" },
    }),
  );
  await page.route("**/api/results", (route) =>
    route.fulfill({
      json:
        route.request().method() === "POST"
          ? { ok: true }
          : { results: [first] },
    }),
  );
  await page.route("**/api/events", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await visit(page, "/");
  await page.evaluate(
    (s) => localStorage.setItem("study-style:session", JSON.stringify(s)),
    {
      ...complete(),
      result: null,
      completedAt: undefined,
      answers: answersFor("motion-team-flexible"),
    },
  );
  await visit(page, "/quiz");
  await acceptQuizIntro(page);
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.locator(".result-character .mystery-card")).toHaveCount(1);
  const latest = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("study-style:session")!),
  );
  expect(latest.isRetake).toBe(true);
  expect(latest.result).toBe("motion-team-flexible");
  expect(
    await page.evaluate(() => localStorage.getItem("study-style:first-result")),
  ).toBeNull();
});

async function visit(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
}
