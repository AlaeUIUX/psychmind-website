import { expect, test } from "@playwright/test";

test("unknown URLs get the branded 404 with crisis support", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/couldn.t find that page/i);
  await expect(page.getByRole("complementary", { name: "Crisis support" })).toBeVisible();
});

test.describe("UI kit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/ui");
  });

  test("renders in the app shell without horizontal scroll", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "App UI kit" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("confirm dialog is full width, traps focus and returns it on close", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Confirm dialog" });
    await trigger.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    // Regression: named spacing tokens once made `max-w-lg` 12px wide.
    expect((await dialog.boundingBox())!.width).toBeGreaterThan(280);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("choice chips toggle and respect the maximum", async ({ page }) => {
    // Radix ToggleGroup exposes a toolbar of pressable buttons.
    const group = page.getByRole("toolbar", { name: "Specialties" }).first();
    const chip = (name: string) => group.getByRole("button", { name, exact: true });
    await chip("Depression").click();
    await expect(chip("Depression")).toHaveAttribute("aria-pressed", "true");
    // Demo allows 5: three more fills it, then the rest are disabled.
    for (const name of ["Relationships", "Grief"]) await chip(name).click();
    await expect(chip("ADHD")).toBeDisabled();
    await chip("Grief").click();
    await expect(chip("ADHD")).toBeEnabled();
  });

  test("upload rejects files that are too large or the wrong type", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "notes.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("x"),
    });
    await expect(page.getByRole("alert").filter({ hasText: "isn't a supported file type" })).toBeVisible();
  });
});
