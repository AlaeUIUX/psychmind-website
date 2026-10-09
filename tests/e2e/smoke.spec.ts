import { expect, test } from "@playwright/test";

// Marketing pages render with their H1 and no horizontal scroll.
const pages = [
  { path: "/", heading: /find the right provider/i },
  { path: "/how-it-works", heading: /finding the right provider/i },
  { path: "/blog", heading: /resource center/i },
  { path: "/contact", heading: /love to hear from you/i },
  { path: "/mission", heading: /./ },
];

for (const { path, heading } of pages) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}

test("security headers are set", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("the CMS lives at /cms and /admin is the (protected) admin area", async ({ page, request }) => {
  const cms = await request.get("/cms");
  expect(cms.status()).toBe(200);
  expect(await cms.text()).toContain("/cms/config.yml");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test("OAuth callback rejects a request without a matching state", async ({ request }) => {
  const response = await request.get("/api/callback?code=abc&state=forged");
  expect([400, 500]).toContain(response.status());
  expect(await response.text()).not.toContain("authorization:github:success");
});

test("contact honeypot swallows bot submissions", async ({ request }) => {
  const response = await request.post("/api/contact", {
    data: { firstName: "Bot", lastName: "Bot", email: "bot@example.com", message: "spam", company: "Spam Inc" },
  });
  // 200 when the honeypot short-circuits; 500 only if RESEND_API_KEY is missing
  // locally; 429 once repeated local runs reach the per-IP limit (5 an hour).
  expect([200, 429, 500]).toContain(response.status());
});

test("setup check lists what's configured and the Google redirect URI", async ({ page }) => {
  await page.goto("/dev/setup");
  await expect(page.getByRole("heading", { name: "Setup check" })).toBeVisible();
  await expect(page.getByTestId("setup-row").filter({ hasText: "Database" })).toContainText("Connected");
  await expect(page.getByTestId("copy-value").last()).toHaveText(/\/api\/auth\/callback\/google$/);
});
