import { expect, test, type Locator, type Page } from "@playwright/test";

const SHOTS = process.env.SHOTS_DIR;

async function hold(page: Page, loc: Locator, ms: number) {
  const box = (await loc.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Nút phải nằm trọn trong khay chứa nó (không bị cắt bởi khay). */
async function expectInside(button: Locator, tray: Locator) {
  const b = (await button.boundingBox())!;
  const t = (await tray.boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(t.x - 1);
  expect(b.y).toBeGreaterThanOrEqual(t.y - 1);
  expect(b.x + b.width).toBeLessThanOrEqual(t.x + t.width + 1);
  expect(b.y + b.height).toBeLessThanOrEqual(t.y + t.height + 1);
}

test("người ngồi cạnh ngắn (trái/phải) nhận và chấp nhận được lời mời giao dịch", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ván mới" }).click();
  await page.getByRole("button", { name: "4 người" }).click();
  await page.getByRole("button", { name: /Bắt đầu/ }).click();
  const trays = page.locator(".tray-seat");
  await expect(trays).toHaveCount(4);
  for (let i = 0; i < 4; i++) await trays.nth(i).getByRole("button", { name: /Đây là khay của tôi/ }).click();
  for (let k = 0; k < 4; k++) {
    await hold(page, page.getByRole("button", { name: /Giữ 1 giây để mở/ }), 1200);
    const cards = page.locator(".drawer.private .chip.card");
    await cards.nth(0).click();
    await cards.nth(1).click();
    await page.getByRole("button", { name: /Xác nhận bỏ/ }).click();
  }
  await expect(page.locator(".phase-pill").first()).toHaveText("Trao đổi");

  // Bố cục 4 người: An (dưới), Bình (trái), Chi (trên), Dũng (phải).
  // An mời Bình (cạnh ngắn trái) rồi Bình mời Dũng (cạnh ngắn phải).
  const an = trays.nth(0);
  const binh = trays.nth(1);
  const dung = trays.nth(3);
  await an.getByRole("button", { name: "Giao dịch", exact: true }).click();
  await an.getByRole("button", { name: /Bình/ }).click();
  await an.locator(".drawer .side").nth(0).getByRole("button", { name: "Thêm xu" }).click();
  await an.getByRole("button", { name: "Gửi đề nghị" }).click();

  const accept = binh.getByRole("button", { name: "Đồng ý" });
  await expect(accept).toBeVisible();
  await expectInside(accept, binh.locator(".tray"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/side-offer.png` });
  await accept.click();
  await expect(binh.getByText("Giao dịch thành công")).toBeVisible();

  await binh.getByRole("button", { name: "Giao dịch", exact: true }).click();
  await binh.getByRole("button", { name: /Dũng/ }).click();
  await binh.locator(".drawer .side").nth(0).getByRole("button", { name: "Thêm xu" }).click();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/side-drawer.png` });
  // Ngăn giao dịch của khay cạnh ngắn không đè lên khay cạnh dài.
  const drawer = (await binh.locator(".drawer").boundingBox())!;
  const anTray = (await an.locator(".tray").boundingBox())!;
  expect(drawer.y + drawer.height).toBeLessThanOrEqual(anTray.y + 1);
  await binh.getByRole("button", { name: "Gửi đề nghị" }).click();
  const accept2 = dung.getByRole("button", { name: "Đồng ý" });
  await expect(accept2).toBeVisible();
  await expectInside(accept2, dung.locator(".tray"));
  await accept2.click();
  await expect(dung.getByText("Giao dịch thành công")).toBeVisible();
});
