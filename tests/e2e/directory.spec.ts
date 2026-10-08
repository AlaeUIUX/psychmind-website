import { expect, test } from "@playwright/test";
import { adminPage, followEmailLink, TEST_PASSWORD, uniqueEmail } from "./fixtures";

// The directory with the 50 sample providers: results with a quick view, the
// full profile in a new tab (its link ends in the public id), and saving — a
// prompt when signed out, the account page for patients. The admin adds the
// samples once; they stay for local browsing.

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const PROFILE = /\/providers\/sara-oliisi-[a-z0-9]{8}$/;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  const admin = await adminPage(browser);
  await admin.goto("/admin/providers");
  const add = admin.getByRole("button", { name: "Add 50 sample providers" });
  const remove = admin.getByRole("button", { name: "Remove samples" });
  await expect(add.or(remove)).toBeVisible();
  if (await add.isVisible()) {
    await add.click();
    await expect(admin.getByRole("status").or(admin.getByRole("alert"))).toBeVisible({ timeout: 90_000 });
    await admin.reload();
  }
  await expect(remove).toBeVisible();
  await admin.context().close();
});

test("results show providers; a quick view opens beside them, the full profile in a new tab", async ({ page, isMobile }) => {
  await page.goto("/providers");
  await expect(page.getByText(/\d+ providers found/)).toBeVisible();
  await expect(page.getByText("These are sample profiles.")).toBeVisible();

  const card = page.getByTestId("provider-card").filter({ hasText: "Sara Oliisi" });
  await card.getByRole("button", { name: "Preview Sara Oliisi" }).click();
  await expect(page).toHaveURL(/[?&]p=[a-z0-9]{8}/);

  // Desktop: beside the list. Phones: a sheet.
  const quick = page.getByRole(isMobile ? "dialog" : "complementary", { name: "Quick view: Sara Oliisi" });
  await expect(quick.getByRole("heading", { name: "Sara Oliisi", exact: true })).toBeVisible();
  await expect(quick.getByText("Florida", { exact: true })).toBeVisible();
  await expect(quick.getByText("Sample profile")).toBeVisible();

  const full = quick.getByRole("link", { name: /See full profile/ }).first();
  await expect(full).toHaveAttribute("target", "_blank");
  expect(await full.getAttribute("href")).toMatch(PROFILE);
  const [profile] = await Promise.all([page.context().waitForEvent("page"), full.click()]);
  await expect(profile).toHaveURL(PROFILE);
  await expect(profile.getByRole("heading", { level: 1, name: "Sara Oliisi" })).toBeVisible();
});

test("the full profile explains Verified and shows where they're licensed", async ({ page }) => {
  await page.goto("/providers");
  const href = await page.getByTestId("provider-card").filter({ hasText: "Sara Oliisi" }).getByRole("link", { name: /See profile/ }).getAttribute("href");
  expect(href).toMatch(PROFILE);

  // An old or mistyped name still finds them by id, and the URL is corrected.
  await page.goto(href!.replace("sara-oliisi", "someone-else"));
  await expect(page).toHaveURL(PROFILE);

  await expect(page.getByText("This is a sample profile.")).toBeVisible();
  await expect(page.getByText("Licensed in Florida")).toBeVisible();
  await expect(page.getByText(/Verified by PsychMind · Florida · License #/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practice locations" })).toBeVisible();
  await expect(page.getByText("1101 Brickell Ave, Suite 800")).toBeVisible();

  await page.getByRole("button", { name: /Verified by PsychMind/ }).click();
  await expect(page.getByText("License checked with the licensing board in Florida")).toBeVisible();
  await page.keyboard.press("Escape");

  // Samples can't be booked.
  await page.getByRole("button", { name: "Request a session" }).click();
  await expect(page.getByRole("dialog", { name: "This is a sample profile" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Signed out, the heart asks for an account and remembers the provider.
  await page.getByRole("button", { name: "Save Sara" }).click();
  const prompt = page.getByRole("dialog", { name: "Save Sara for later" });
  await expect(prompt).toBeVisible();
  const signUpHref = await prompt.getByRole("link", { name: "Create a free account" }).getAttribute("href");
  expect(decodeURIComponent(signUpHref!)).toMatch(/^\/signup\/patient\?next=\/providers\/sara-oliisi-[a-z0-9]{8}\?save=1$/);
});

test("an unknown profile id shows provider not found", async ({ page }) => {
  const response = await page.goto("/providers/nobody-zzzzzzzz");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn't find this provider" })).toBeVisible();
});

test("signing up from the save prompt comes back with the provider saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "The sign-up flow itself is covered on desktop.");
  const email = uniqueEmail("patient");
  await page.goto("/providers");
  await page.getByTestId("provider-card").filter({ hasText: "Sara Oliisi" }).getByRole("button", { name: "Save Sara" }).click();
  await page.getByRole("link", { name: "Create a free account" }).click();

  await page.getByLabel("First name").fill("Annah");
  await page.getByLabel("Last name").fill("Solto");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await followEmailLink(page, email);

  await expect(page).toHaveURL(PROFILE);
  await expect(page.getByText("Sara saved")).toBeVisible();
  await expect(page.getByRole("button", { name: /Saved — remove Sara/ })).toBeVisible();

  await page.goto("/account");
  const saved = page.getByTestId("saved-provider").filter({ hasText: "Sara Oliisi" });
  await expect(saved).toBeVisible();
  await saved.getByRole("button", { name: /Saved — remove Sara/ }).click();
  await expect(page.getByText("Sara removed from your saved providers")).toBeVisible();
  await page.reload();
  await expect(page.getByText("No saved providers yet")).toBeVisible();
});
