import { expect, test, type Locator, type Page } from "@playwright/test";

const SHOTS = process.env.SHOTS_DIR;

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function hold(page: Page, loc: Locator, ms: number) {
  const box = (await loc.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test("3 người chơi trọn một vòng: chọn địa điểm → giao dịch → xây → thu nhập, rồi khôi phục sau reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ván mới" }).click();
  await page.getByRole("button", { name: "3 người" }).click();
  await shot(page, "01-setup");
  await page.getByRole("button", { name: /Bắt đầu/ }).click();

  const trays = page.locator(".tray-seat");
  await expect(trays).toHaveCount(3);
  for (let i = 0; i < 3; i++) await trays.nth(i).getByRole("button", { name: /Đây là khay của tôi/ }).click();
  await shot(page, "02-prep-cover");

  // Chọn địa điểm: lần lượt từng người xem riêng.
  for (let k = 0; k < 3; k++) {
    const open = page.getByRole("button", { name: /Giữ 1 giây để mở/ });
    await expect(open).toHaveCount(1);
    // Chỉ khay đang tới lượt mới có thẻ; khay khác không render số thẻ.
    await expect(page.locator(".chip.card")).toHaveCount(0);
    await hold(page, open, 1200);
    const cards = page.locator(".drawer.private .chip.card");
    await expect(cards.first()).toBeVisible();
    if (k === 0) await shot(page, "03-private-view");
    await cards.nth(0).click();
    await cards.nth(1).click();
    await page.getByRole("button", { name: /Xác nhận bỏ/ }).click();
  }
  await expect(page.locator(".phase-pill").first()).toHaveText("Trao đổi");

  // Giao dịch: An đưa 1 ô + 2 xu, nhận 1 tuile của Bình.
  await trays.nth(0).getByRole("button", { name: /Giao dịch/ }).click();
  await trays.nth(0).getByRole("button", { name: /Bình/ }).click();
  const sides = trays.nth(0).locator(".drawer .side");
  await sides.nth(0).locator(".chip.asset").first().click();
  await sides.nth(0).getByRole("button", { name: "＋" }).click();
  await sides.nth(0).getByRole("button", { name: "＋" }).click();
  await sides.nth(1).locator(".chip.asset", { hasText: /^[^ô]/ }).first().click();
  await shot(page, "04-trade-drawer");
  await trays.nth(0).getByRole("button", { name: "Gửi đề nghị" }).click();
  await expect(trays.nth(1).locator(".trade-card.offer")).toBeVisible();
  await shot(page, "05-trade-offer");
  await trays.nth(1).getByRole("button", { name: "Đồng ý" }).click();
  await expect(trays.nth(0).getByText("Giao dịch thành công ✓")).toBeVisible();
  await expect(trays.nth(0).locator(".money")).toHaveText(/3 xu/);
  await expect(trays.nth(1).locator(".money")).toHaveText(/7 xu/);

  for (let i = 0; i < 3; i++) await trays.nth(i).getByRole("button", { name: "Xong ✓" }).click();
  await expect(page.locator(".phase-pill").first()).toHaveText("Xây dựng");

  // Xây: người 0 chọn ô trên bàn chung, người 1–2 chọn trên bản đồ nhỏ trong khay.
  for (let i = 0; i < 3; i++) {
    await trays.nth(i).locator(".chip.tile").first().click();
    if (i === 0) {
      await shot(page, "06-build-armed");
      await page.locator(".board-wrap g.mark-buildable").first().click();
    } else {
      await trays.nth(i).locator("svg.mini g.mark-buildable").first().click();
    }
    await expect(trays.nth(i).getByText(/Xây .* tại ô/)).toBeVisible();
    if (i === 0) await shot(page, "07-build-preview");
    await trays.nth(i).getByRole("button", { name: "Xây ✓" }).click();
  }
  await expect(page.locator(".board-wrap text").filter({ hasText: /[🎪👻🚀🎠🚂🛶🎢🎡🌊]/ })).toHaveCount(3);

  for (let i = 0; i < 3; i++) await trays.nth(i).getByRole("button", { name: "Xong ✓" }).click();
  await expect(page.locator(".phase-pill").first()).toHaveText("Thu nhập");
  await expect(page.locator(".center-banner")).toBeVisible();
  await shot(page, "08-income");
  for (let i = 0; i < 3; i++) await trays.nth(i).getByRole("button", { name: /Tiếp tục/ }).click();
  await expect(page.locator(".status-line b").first()).toHaveText("Vòng 2/4");

  // Reload: ván được khôi phục từ IndexedDB.
  await page.reload();
  await expect(page.getByRole("button", { name: /Tiếp tục ván đang chơi \(vòng 2\)/ })).toBeVisible();
  await page.getByRole("button", { name: /Tiếp tục ván đang chơi/ }).click();
  await expect(page.locator(".tray-seat")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Giữ 1 giây để mở/ })).toHaveCount(1);
  await shot(page, "09-restored");
});

test("5 người: bố cục hai ghế chia cạnh dưới", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ván mới" }).click();
  await page.getByRole("button", { name: "5 người" }).click();
  await page.getByRole("button", { name: /Bắt đầu/ }).click();
  await expect(page.locator(".tray-seat")).toHaveCount(5);
  await shot(page, "10-five-players");
});
