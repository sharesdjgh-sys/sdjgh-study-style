import { expect, test } from "@playwright/test";
import { mockSkills } from "./skill-fixture";
import { goodsPrice, getGoods } from "../../src/lib/goods";
import sharp from "sharp";
test("굿즈 필터, 카드마다 다른 뒷면, 팝업 닫기와 반응형 배치", async ({
  page,
}) => {
  await mockSkills(page);
  await page.goto("/goods");
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(
    128,
  );
  await page
    .getByRole("navigation", { name: "굿즈 캐릭터" })
    .getByRole("button", { name: /루미/ })
    .click();
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(8);
  await page
    .getByRole("button", { name: "일상 포토카드", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(3);
  const open = page.getByRole("button", {
    name: "루미 도서관의 작은 쉼표 카드 보기",
  });
  await open.click();
  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "뒷면 보기" }).click();
  await expect(
    dialog.getByText("“이 장면은 마음속에 밑줄 쳐둘래.”"),
  ).toBeVisible();
  await page.getByRole("button", { name: "다음 카드 →" }).click();
  await page.getByRole("button", { name: "뒷면 보기" }).click();
  await expect(
    dialog.getByText("“오늘의 도착지는 따뜻한 코코아야.”"),
  ).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: `test-results/goods-back-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.getByRole("button", { name: "전체", exact: true }).click();
  await page
    .getByRole("navigation", { name: "굿즈 캐릭터" })
    .getByRole("button", { name: /모든 친구/ })
    .click();
  await page.getByLabel("내 공부캐만").check();
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/goods-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("비로그인도 전체 굿즈를 둘러보고 내 공부캐 필터의 안내를 볼 수 있다", async ({
  page,
}) => {
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ json: { signedIn: false, configured: true } }),
  );
  await page.goto("/goods");
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(
    128,
  );
  await page.getByLabel("내 공부캐만").check();
  await expect(
    page.getByRole("heading", { name: "첫 공부 친구를 만나볼까요?" }),
  ).toBeVisible();
});
test("특별 의상은 별 2개로 확인 후 교환하고 내 굿즈에서 앞뒤 저장한다", async ({
  page,
}) => {
  const state = await mockSkills(page);
  state.goods.balance = 2;
  let purchases = 0;
  await page.route("**/api/goods", async (r) => {
    if (r.request().method() === "POST") {
      const { id } = r.request().postDataJSON();
      const card = getGoods(id)!;
      if (!state.goods.owned.includes(id)) {
        state.goods.balance -= goodsPrice(card);
        state.goods.owned.push(id);
        purchases++;
      }
    }
    return r.fulfill({
      json: {
        accountId: "e1dcbb36-9c6e-4de6-8f57-f11b43765a7c",
        progress: state.goods,
        outcome: "redeemed",
      },
    });
  });
  const jpeg = await sharp("public/goods/visual-solo-planned--special-01.webp")
    .jpeg()
    .toBuffer();
  await page.route("**/api/goods/image?*", (r) =>
    r.fulfill({
      contentType: "image/jpeg",
      body: jpeg,
      headers: {
        "Content-Disposition": r.request().url().includes("download=1")
          ? 'attachment; filename="goods.jpg"'
          : "inline",
      },
    }),
  );
  await page.goto("/goods");
  await page
    .getByRole("button", { name: "루미 별지도를 펼치는 마법사 카드 보기" })
    .click();
  await page.getByRole("button", { name: "별 2개로 교환하기" }).click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  expect(purchases).toBe(0);
  await page.getByRole("button", { name: "별 2개로 교환하기" }).click();
  await page
    .getByRole("button", { name: "별 2개로 교환", exact: true })
    .click();
  await expect(
    page.getByText("새로운 한 장이 내 굿즈에 들어왔어요!"),
  ).toBeVisible();
  expect(purchases).toBe(1);
  expect(state.goods.balance).toBe(0);
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "이미지 저장", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.jpg$/);
  await page.getByRole("button", { name: "뒷면 보기" }).click();
  await expect(
    page.getByRole("link", { name: "이미지 저장", exact: true }),
  ).toHaveAttribute("href", /side=back/);
  await page.keyboard.press("Escape");
  await page.goto("/goods?view=owned");
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("button", { name: /카드 보기$/ })).toHaveCount(1);
  await page.getByLabel("내 굿즈만").uncheck();
  await page
    .getByRole("button", { name: "루미 비 오는 날의 코코아 카드 보기" })
    .click();
  await expect(
    page.getByRole("button", { name: "별 1개로 교환하기" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "모아 도서관의 작은 쉼표 카드 보기" })
    .click();
  await expect(
    page.getByText(/먼저 캐릭터 카드를 도감에 모아 주세요/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /별 .*교환하기/ })).toHaveCount(
    0,
  );
});
