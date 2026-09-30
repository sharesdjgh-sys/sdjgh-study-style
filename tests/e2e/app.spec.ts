import { test, expect } from "@playwright/test";
test("홈과 스타일 탐색, 작은 화면에서 가로 넘침 없음", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /남들 말고/ })).toBeVisible();
  await page.getByRole("button", { name: "말해서", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "이야기 편집자", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "스타일 도감", exact: true })
    .first()
    .click();
  await expect(page.locator(".type-tile")).toHaveCount(16);
  await page.getByRole("button", { name: "촉각형", exact: true }).click();
  await expect(page.locator(".type-tile")).toHaveCount(4);
});
test("미응답 검사, 복구, 동점 선택, 결과와 활동 평가", async ({ page }) => {
  await page.goto("/quiz");
  await page.getByRole("button", { name: "다음 질문" }).click();
  await expect(page.locator(".error-message[role=alert]")).toContainText(
    "답을 하나",
  );
  await page.getByRole("radio", { name: "보통이에요", exact: true }).check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.reload();
  await expect(page.locator(".question-number")).toHaveText("질문 02");
  for (let i = 1; i < 16; i++) {
    await expect(page.locator(".question-number")).toHaveText(
      `질문 ${String(i + 1).padStart(2, "0")}`,
    );
    await page.getByRole("radio", { name: "보통이에요", exact: true }).check();
    await page
      .getByRole("button", {
        name: i === 15 ? "내 결과 보기" : "다음 질문",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: /지금 시도해/ }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "기억으로 개념 지도 그리기" }).check();
  await page.getByRole("radio", { name: "혼자 차분히" }).check();
  await page.getByRole("radio", { name: "순서를 정해서" }).check();
  await page.getByRole("button", { name: "내 결과 보기", exact: true }).click();
  await expect(page.locator(".discovery-shell")).toBeVisible();
  await expect(page.locator(".discovery-tile")).toHaveCount(16);
  await expect(page.locator(".discovery-shell button")).toHaveCount(0);
  await expect(page.locator(".discovery-shell")).toHaveAttribute(
    "data-stage",
    "3",
  );
  await expect(page.locator(".discovery-tile.is-match")).toHaveCount(1);
  await expect(page).toHaveURL(/\/result$/);
  await expect(
    page.getByRole("heading", { name: "차분한 지도 설계자", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "어, 이거 내 얘긴데?" }),
  ).toBeVisible();
  const scene = page.locator(".scene-button").first();
  await scene.click();
  await expect(scene).toHaveAttribute("aria-pressed", "true");
  await scene.click();
  await expect(scene).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByText("비슷한 후보 중 직접 선택한 대표 스타일이에요."),
  ).toBeVisible();
  await page.getByRole("button", { name: "암기", exact: true }).click();
  await expect(page.getByText(/외울 용어 5개/)).toBeVisible();
  await page.getByRole("button", { name: "지금 10분 해보기" }).click();
  await page
    .getByRole("button", { name: "해봤어요 · 도움 됐어요", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "해봤어요 · 도움 됐어요", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "이 기기의 기록 지우기", exact: true })
    .click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "차분한 지도 설계자" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "이 기기의 기록 지우기", exact: true })
    .click();
  await page.getByRole("button", { name: "기록 지우기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "아직 이 기기에 결과가 없어요." }),
  ).toBeVisible();
});
test("저장소 차단과 공유 실패에서도 사용 가능", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await page.goto("/quiz");
  await expect(page.getByRole("status")).toContainText("이어하기 저장");
  await page.getByRole("radio", { name: "그런 편이에요", exact: true }).check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await expect(page.locator(".question-number")).toHaveText("질문 02");
  await page.goto("/types/visual-solo-planned");
  await expect(page.getByText(/개인 검사 결과는 아니에요/)).toBeVisible();
  await page.getByRole("button", { name: "카카오톡 공유" }).click();
  await expect(page.locator(".share-block [role=status]")).toContainText(
    "링크 복사",
  );
});
test("OG, QR, 없는 경로", async ({ page, request }) => {
  const og = await request.get("/api/og?type=visual-solo-planned");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
  const qr = await request.get("/api/qr");
  expect(qr.status()).toBe(200);
  await page.goto("/types/no-such-type");
  await expect(
    page.getByRole("heading", { name: "이 페이지를 찾지 못했어요." }),
  ).toBeVisible();
});
