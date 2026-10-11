import { expect, test } from "@playwright/test";
import { fillBirthDate, signUp, TEST_PASSWORD, uniqueEmail } from "./fixtures";

// The legal safeguards end to end (docs/legal/README.md): the 18+ age
// screen, the unsubscribe page, the copyright policy, and that pages load
// nothing from other hosts.

test.skip(({ isMobile }) => isMobile, "Flows run on desktop; the sign-up layout is covered at 375px elsewhere.");
test.setTimeout(90_000);

test("sign-up asks for a date of birth and turns away under-18s for the day", async ({ page, context }) => {
  await page.goto("/signup/patient");
  await page.getByLabel("First name").fill("Kid");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Email").fill(uniqueEmail("minor"));
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);

  // Missing date: a field error, nothing else happens.
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your date of birth")).toBeVisible();

  // Under 18: no account, and the form stays closed.
  const lastYear = String(new Date().getFullYear() - 10);
  await fillBirthDate(page, { year: lastYear });
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByTestId("age-blocked")).toBeVisible();
  await expect(page.getByRole("link", { name: "Call 988" })).toBeVisible();

  // Going back and picking another year doesn't work…
  await page.goto("/signup/provider");
  await expect(page.getByTestId("age-blocked")).toBeVisible();
  await page.goto("/signup");
  await expect(page.getByTestId("age-blocked")).toBeVisible();

  // …but it's only this browser, not a ban on the address.
  await context.clearCookies();
  await page.goto("/signup/patient");
  await expect(page.getByLabel("Year")).toBeVisible();
});

test("the sign-up endpoint itself refuses a missing or under-age date of birth", async ({ request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const body = { name: "Direct Call", email: uniqueEmail("direct"), password: TEST_PASSWORD };
  const post = (data: object) => request.post("/api/auth/sign-up/email", { data, headers: { origin } });
  const missing = await post(body);
  expect(missing.status()).toBe(400);
  expect((await missing.json()).code).toBe("DATE_OF_BIRTH_REQUIRED");
  const minor = await post({ ...body, dateOfBirth: `${new Date().getFullYear() - 12}-01-01` });
  expect(minor.status()).toBe(403);
  expect((await minor.json()).code).toBe("AGE_REQUIREMENT");
});

test("an adult signs up as before", async ({ page }) => {
  await signUp(page, "patient", uniqueEmail("adult"), "Ada", "Grown");
  await expect(page).toHaveURL(/\/account/);
});

test("unsubscribe links: a bad token is explained, and one-click POSTs answer", async ({ page, request }) => {
  await page.goto("/unsubscribe/not-a-real-token-at-all-000000");
  await expect(page.getByRole("heading", { name: "This link doesn't work" })).toBeVisible();
  expect((await request.post("/api/unsubscribe/not-a-real-token-at-all-000000")).status()).toBe(404);
});

test("the copyright policy is public and linked from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Copyright Policy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Copyright policy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3. Our designated agent" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "5. Counter-notification" })).toBeVisible();
});

test("pages load nothing from other hosts", async ({ page, baseURL }) => {
  const own = new URL(baseURL!).hostname.replace(/^app\./, "");
  const foreign: string[] = [];
  page.on("request", (r) => {
    const host = new URL(r.url()).hostname;
    if (!r.url().startsWith("data:") && !r.url().startsWith("blob:") && !host.endsWith(own)) foreign.push(r.url());
  });
  for (const path of ["/", "/how-it-works", "/providers", "/signup/patient", "/login"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(foreign).toEqual([]);
});
