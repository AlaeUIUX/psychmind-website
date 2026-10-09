import { expect, test } from "@playwright/test";
import { adminPage, choosePassword, latestTemporaryPassword, logIn, newTemporaryPassword, TEST_PASSWORD, totp } from "./fixtures";

// Admin accounts are made for people, never signed up for: a temporary
// password by email, then their own password and an authenticator app
// before the console opens. Another admin can reset someone's access.

/** A second local admin (ADMIN_EMAILS in .env.local). Each run resets their access. */
const NEW_ADMIN = "new-admin@psychmind.test";
const NEW_PASSWORD = "Quiet-Lantern-2026!";

test.describe.configure({ mode: "serial" });
test.setTimeout(90_000);
test.skip(({ isMobile }) => isMobile, "Account flows run on desktop; the screens are the same sign-in pages.");

test("signed-out visitors to the console get the admin log-in", async ({ page }) => {
  await page.goto("/admin/providers");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproviders$/);
  await expect(page.getByRole("heading", { level: 1, name: "Admin log-in" })).toBeVisible();
  // No sign-up and no Google here.
  await expect(page.getByRole("link", { name: "Create account" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
});

test("a new admin replaces the temporary password and sets up an authenticator first", async ({ page, browser }) => {
  // Their account exists as soon as anyone opens the admin pages. Reset it so
  // the run starts from a fresh temporary password.
  const admin = await adminPage(browser);
  const previous = await latestTemporaryPassword(admin, NEW_ADMIN);
  await admin.goto("/admin/admins");
  const row = admin.getByTestId("admin-row").filter({ hasText: NEW_ADMIN });
  await row.getByRole("button", { name: "Reset access" }).click();
  await admin.getByRole("alertdialog").getByRole("button", { name: "Reset access" }).click();
  await expect(admin.getByText(/New temporary password sent/)).toBeVisible();
  await expect(row).toContainText("Invited");
  const temp = await newTemporaryPassword(admin, NEW_ADMIN, previous);

  await page.goto("/admin");
  await logIn(page, NEW_ADMIN, temp);

  // Their own password, not the temporary one, and long enough.
  await expect(page.getByRole("heading", { name: "Choose your password" })).toBeVisible();
  await choosePassword(page, "Nadia", "Haddad", temp);
  await expect(page.getByText("Choose a new password, not the temporary one.")).toBeVisible();
  await page.getByLabel("New password").fill("too-short");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("Use at least 12 characters.")).toBeVisible();
  await page.getByLabel("New password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save and continue" }).click();

  // The console stays shut until the authenticator is set up.
  await expect(page.getByRole("heading", { name: "Set up two-step login" })).toBeVisible();
  await page.goto("/admin/providers");
  await expect(page).toHaveURL(/\/two-factor\/setup$/);
  await page.getByLabel("Confirm your password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  const secret = (await page.getByTestId("totp-key").textContent())!.replace(/\s/g, "");
  await page.getByLabel("Code from your app").fill(totp(secret));
  await page.getByRole("button", { name: "Turn on two-step login" }).click();
  await expect(page.getByRole("heading", { name: "Save your backup codes" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Verification queue" })).toBeVisible();

  // Signing out goes back to the admin log-in, where the temporary password no longer works.
  await page.getByRole("button", { name: /Nadia Haddad/ }).click();
  await page.getByRole("menuitem", { name: /Log out|Sign out/ }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await logIn(page, NEW_ADMIN, temp);
  await expect(page.getByText("That email and password don't match. Please try again.")).toBeVisible();

  // The other admin now sees them as active, under their own name.
  await admin.goto("/admin/admins");
  await expect(row).toContainText("Nadia Haddad");
  await expect(row).toContainText("Active");
  await admin.context().close();
});

test("signing up with an admin's address creates nothing", async ({ page }) => {
  const confirmations = async () => {
    await page.goto("/dev/mail");
    return page.getByTestId("dev-mail").filter({ hasText: NEW_ADMIN }).filter({ hasText: "Confirm your email" }).count();
  };
  const before = await confirmations();
  await page.goto("/signup/patient");
  await page.getByLabel("First name").fill("Not");
  await page.getByLabel("Last name").fill("Admin");
  await page.getByLabel("Email").fill(NEW_ADMIN);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // Same answer as any sign-up, so the form doesn't reveal who the admins are…
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  // …but no account and no confirmation email.
  await page.waitForTimeout(1500);
  expect(await confirmations()).toBe(before);
});
