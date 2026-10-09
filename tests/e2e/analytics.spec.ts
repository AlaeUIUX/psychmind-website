import { expect, test } from "@playwright/test";
import { adminPage } from "./fixtures";

// In-house analytics: pages report counts to /api/events, and the admin
// dashboard adds them up. (The provider's own dashboard is covered by the
// provider journey.)

const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const count = async (text: string | null) => Number((text ?? "").replace(/[^\d]/g, ""));

test("a visitor's search shows up on the admin dashboard", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "The admin console is checked on desktop.");
  const admin = await adminPage(browser);
  await admin.goto("/admin/analytics");
  await expect(admin.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
  const searches = admin.getByRole("group", { name: "Searches" }).locator('[data-slot="stat-value"]');
  const before = await count(await searches.textContent());

  await page.goto("/providers?format=online&where=TX&specialty=anxiety");
  await expect(page.getByTestId("provider-card").first()).toBeVisible();
  await page.goto("/"); // leaving sends the page's events

  await expect(async () => {
    await admin.reload();
    expect(await count(await searches.textContent())).toBeGreaterThan(before);
  }).toPass({ timeout: 30_000 });
  await expect(admin.getByRole("region", { name: "Top searches" })).toContainText("Anxiety · Online · Texas");
  const shot = test.info().outputPath("admin-analytics.png");
  await admin.screenshot({ path: shot, fullPage: true });
  await test.info().attach("admin-analytics", { path: shot, contentType: "image/png" });

  // The custom range opens a calendar; a preset changes the address.
  await admin.getByRole("radio", { name: "Custom" }).click();
  await expect(admin.getByRole("dialog").or(admin.locator("[data-slot=popover-content]"))).toBeVisible();
  await admin.keyboard.press("Escape");
  await admin.getByRole("radio", { name: "Last 3 months" }).click();
  await expect(admin).toHaveURL(/\?range=90d$/);
  await expect(admin.getByRole("radio", { name: "Last 3 months" })).toHaveAttribute("aria-checked", "true");

  // The chart has a table view with one row per day.
  await admin.getByRole("radio", { name: "Table" }).click();
  await expect(admin.getByRole("table").first().locator("tbody tr")).toHaveCount(90);
  await admin.context().close();
});

test("the events endpoint only takes small, well-formed batches", async ({ request }) => {
  const post = (data: string, headers: Record<string, string> = {}) =>
    request.post("/api/events", { data, headers: { "content-type": "application/json", "user-agent": BROWSER, ...headers } });
  expect((await post("not json")).status()).toBe(400);
  expect((await post(JSON.stringify({ events: [{ t: "view", page: "nowhere" }] }))).status()).toBe(400);
  // Only known values get through: a bad provider id is refused.
  expect((await post(JSON.stringify({ events: [{ t: "profile_view", p: "<script>" }] }))).status()).toBe(400);
  expect((await post(JSON.stringify({ events: [{ t: "view", page: "home" }] }) + " ".repeat(21_000))).status()).toBe(413);
  expect((await post(JSON.stringify({ events: [{ t: "view", page: "home" }] }))).status()).toBe(204);
  // Another site's pages can't report (and aren't told why).
  expect((await post(JSON.stringify({ events: [{ t: "view", page: "home" }] }), { origin: "https://example.com" })).status()).toBe(204);
  expect((await post("not json", { origin: "null" })).status()).toBe(204);
});

test("analytics sets no cookies", async ({ page }) => {
  await page.goto("/providers");
  await expect(page.getByTestId("provider-card").first()).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.filter((c) => !c.name.startsWith("psychmind"))).toEqual([]);
});
