import { test, expect } from "@playwright/test";
import { VERSION, QUESTIONS } from "../../src/lib/content";
import { EMPTY_COLLECTION } from "../../src/lib/collection-contract";
import { answersFor } from "../answers";
import type { Session } from "../../src/lib/storage";

test("로그인 후 첫 검사와 재검사를 서버에 보내고 저장 실패를 재시도한다", async ({
  page,
}) => {
  function result(code: string, isRetake = false): Session {
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
      answers: answersFor(code),
      isRetake,
    };
  }
  const first = result("visual-solo-planned"),
    latest = result("motion-team-flexible", true);
  const stored: Session[] = [];
  let fail = true;
  await page.route(/\/api\/(?:collection|auth\/session)$/, (route) =>
    route.fulfill({
      json: {
        ...EMPTY_COLLECTION,
        signedIn: true,
        accountId: "sync-test",
        firstRunId: first.runId,
        firstType: first.result,
      },
    }),
  );
  await page.route("**/api/referrals", (route) =>
    route.fulfill({ json: { code: null } }),
  );
  await page.route("**/api/results", async (route) => {
    if (route.request().method() === "POST") {
      if (fail)
        return route.fulfill({ status: 503, json: { error: "unavailable" } });
      const s = route.request().postDataJSON() as Session;
      expect(s.answers).toEqual(
        s.runId === first.runId ? first.answers : latest.answers,
      );
      expect(s).not.toHaveProperty("scores");
      if (!stored.some((r) => r.runId === s.runId)) stored.push(s);
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { results: stored } });
  });
  await page.addInitScript(
    ({ first, latest }) => {
      localStorage.setItem("study-style:first-result", JSON.stringify(first));
      localStorage.setItem("study-style:session", JSON.stringify(latest));
    },
    { first, latest },
  );
  await page.goto("/result");
  await expect(
    page.getByRole("region", { name: "계정에 저장한 검사 결과" }),
  ).toContainText("계정에 저장하지 못했어요");
  fail = false;
  await page
    .getByRole("button", { name: "결과 저장·불러오기 다시 시도" })
    .click();
  await expect(
    page.getByRole("region", { name: "계정에 저장한 검사 결과" }),
  ).toContainText("점수를 계정에 보관했어요");
  expect(stored.map((s) => s.runId).sort()).toEqual(
    [first.runId, latest.runId].sort(),
  );
  await page.goto("/collection");
  await expect(page.locator(".saved-results-list li")).toHaveCount(2);
});
