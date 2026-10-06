import { test, expect } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
test("10분 타이머를 멈췄다 이어 끝내고 세 질문에 답해야 최초 별을 받는다", async ({
  page,
}) => {
  await page.clock.install();
  const state = await mockSkills(page);
  await page.goto("/methods/outline");
  await page.getByRole("button", { name: "지금 10분 해보기" }).click();
  const timer = page.getByRole("timer");
  await page.clock.runFor(20000);
  await expect(timer).toContainText("09:40");
  await page.getByRole("button", { name: "잠시 멈추기" }).click();
  await expect(page.getByRole("button", { name: "이어서 하기" })).toBeVisible();
  const paused = await timer.textContent();
  await page.clock.runFor(30000);
  await expect(timer).toHaveText(paused!);
  await page.getByRole("button", { name: "이어서 하기" }).click();
  await page.clock.fastForward(600000);
  await expect(timer).toContainText("00:00");
  const submit = page.getByRole("button", {
    name: "실천 완료하고 별 1개 받기",
  });
  await expect(submit).toBeDisabled();
  for (const field of await page.locator(".skill-feedback fieldset").all())
    await field.getByRole("radio").last().check();
  await submit.click();
  await expect(
    page.getByText("첫 실천 완료! 별 1개를 받았어요. 굿즈를 골라볼까요?"),
  ).toBeVisible();
  expect(state.progress.balance).toBe(3);
  expect(state.goods.balance).toBe(1);
  expect(state.completed).toBe(1);
  await page.reload();
  await expect(page.getByText("첫 보상 받음", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "지금 10분 해보기" }).click();
  await page.clock.fastForward(600000);
  await expect(timer).toContainText("00:00");
  for (const field of await page.locator(".skill-feedback fieldset").all())
    await field.getByRole("radio").last().check();
  await page.getByRole("button", { name: "실천 기록 남기기" }).click();
  await expect(
    page.getByText(
      "오늘의 실천을 기록했어요. 이 스킬의 첫 실천 별은 이미 받았어요.",
    ),
  ).toBeVisible();
  expect(state.progress.balance).toBe(3);
  expect(state.goods.balance).toBe(1);
  expect(state.completed).toBe(2);
});
