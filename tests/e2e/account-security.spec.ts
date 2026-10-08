import { expect, test, type Page } from "@playwright/test";
import { signUp, TEST_PASSWORD, totp, uniqueEmail } from "./fixtures";

// Two-step login, "download my data", account deletion and the
// Content-Security-Policy, against the local app (PGlite + /dev/mail).

test.skip(({ isMobile }) => isMobile, "Account flows run on desktop; layouts are covered elsewhere.");
test.setTimeout(120_000);

async function logIn(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

async function logOut(page: Page) {
  await page.goto("/account/settings");
  await page.getByRole("button", { name: "Log out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
}

test("two-step login: set up, wrong code, backup code", async ({ page }) => {
  const email = uniqueEmail("twostep");
  await signUp(page, "patient", email, "Maya", "Stone");

  await page.goto("/account/settings");
  await page.getByRole("link", { name: "Turn on" }).click();
  await page.getByLabel("Confirm your password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  const secret = (await page.getByTestId("totp-key").textContent())!.replace(/\s/g, "");

  // A wrong code doesn't turn it on.
  await page.getByLabel("Code from your app").fill(totp(secret) === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Turn on two-step login" }).click();
  await expect(page.getByText("That code didn't work")).toBeVisible();

  await page.getByLabel("Code from your app").fill(totp(secret));
  await page.getByRole("button", { name: "Turn on two-step login" }).click();
  await expect(page.getByRole("heading", { name: "Save your backup codes" })).toBeVisible();
  const backupCode = (await page.getByTestId("backup-codes").locator("li").first().textContent())!.trim();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/account$/);

  // The password alone no longer signs in.
  await logOut(page);
  await logIn(page, email);
  await expect(page.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
  await page.getByLabel("Authentication code").fill("123456" === totp(secret) ? "654321" : "123456");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("That code didn't work")).toBeVisible();

  // A backup code works once.
  await page.getByRole("button", { name: "Lost your phone? Use a backup code" }).click();
  await page.getByLabel("Backup code").fill(backupCode);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/account/settings");
  await expect(page.getByText("On", { exact: true })).toBeVisible();
});

test("download my data, then delete the account", async ({ page }) => {
  const email = uniqueEmail("leaving");
  await signUp(page, "patient", email, "Noor", "Hale");

  // The export has the account but never secrets. (Fetched from the page: the
  // session cookie belongs to the portal host.)
  const exportData = () =>
    page.evaluate(async () => {
      const r = await fetch("/api/account/export");
      return { status: r.status, disposition: r.headers.get("content-disposition"), body: await r.text() };
    });
  const response = await exportData();
  expect(response.status).toBe(200);
  expect(response.disposition).toContain("attachment");
  const body = response.body;
  const data = JSON.parse(body);
  expect(data.account.email).toBe(email);
  expect(data.signInMethods[0].method).toBe("credential");
  expect(body).not.toMatch(/"password"|"token"|"secret"|"backupCodes"/);

  await page.goto("/account/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByLabel("Enter your password to confirm").fill("not-my-password");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByText("That password isn't right.")).toBeVisible();

  await page.getByLabel("Enter your password to confirm").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByText("Your account has been deleted.")).toBeVisible();

  // Gone: the session is over and the login no longer exists.
  expect((await exportData()).status).toBe(401);
  await logIn(page, email);
  await expect(page.getByText("don't match")).toBeVisible();
});

test("portal pages get a nonce-based Content-Security-Policy", async ({ page }) => {
  const portal = (await page.goto("/login"))!.headers()["content-security-policy"];
  expect(portal).toMatch(/script-src 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(portal).toContain("object-src 'none'");
  expect(portal).toContain("frame-ancestors 'none'");

  const marketing = (await page.goto("/how-it-works"))!.headers()["content-security-policy"];
  expect(marketing).toContain("script-src 'self' 'unsafe-inline'");
  expect(marketing).not.toContain("nonce-");
});
