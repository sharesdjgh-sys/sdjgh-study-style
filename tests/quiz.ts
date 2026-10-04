import { expect, type Page } from "@playwright/test";

export async function acceptQuizIntro(page: Page) {
  const consent = page.getByRole("checkbox", {
    name: "서비스 취지와 주의사항을 읽고 이해했어요.",
  });
  await expect(consent).toBeVisible();
  await consent.check();
  await page.getByRole("button", { name: /동의하고/ }).click();
}
