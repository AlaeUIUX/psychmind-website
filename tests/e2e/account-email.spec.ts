import { expect, test, type Page } from "@playwright/test";
import { adminPage, followEmailLink, signUp, TEST_PASSWORD, totp, uniqueEmail } from "./fixtures";

// Settings → Login: change password, change email (old inbox, then new
// inbox), the authenticator path when the old inbox is gone, and account
// recovery through support. Against the local app (PGlite + /dev/mail).

test.skip(({ isMobile }) => isMobile, "Account flows run on desktop; layouts are covered elsewhere.");
test.setTimeout(150_000);

const NEW_PASSWORD = "Quiet-Lantern-2026!";

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

const emailRow = (page: Page) => page.getByRole("button", { name: "Change email" });

test("change password from Settings", async ({ page }) => {
  const email = uniqueEmail("newpass");
  await signUp(page, "patient", email, "Lena", "Park");

  await page.goto("/account/settings");
  await page.getByRole("button", { name: "Change password" }).click();
  await page.getByLabel("Current password").fill("not-my-password");
  await page.getByLabel("New password").fill(NEW_PASSWORD);
  await page.getByRole("dialog").getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("That password isn't right.")).toBeVisible();

  await page.getByLabel("Current password").fill(TEST_PASSWORD);
  await page.getByLabel("New password").fill(NEW_PASSWORD);
  await page.getByRole("dialog").getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed")).toBeVisible();

  await logOut(page);
  await logIn(page, email);
  await expect(page.getByText("don't match")).toBeVisible();
  await logIn(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/account$/);
});

test("change email: confirm the old inbox, then the new one", async ({ page }) => {
  const email = uniqueEmail("oldbox");
  const next = uniqueEmail("newbox");
  await signUp(page, "patient", email, "Omar", "Reyes");

  await page.goto("/account/settings");
  await emailRow(page).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(email)).toBeVisible();
  await dialog.getByRole("button", { name: "Send verification link" }).click();
  await expect(dialog.getByRole("heading", { name: "Check your inbox" })).toBeVisible();

  await followEmailLink(page, email);
  await expect(page.getByRole("heading", { name: "Choose your new email" })).toBeVisible();
  await page.getByLabel("New email").fill(email);
  await page.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(page.getByText("That's already your email.")).toBeVisible();
  await page.getByLabel("New email").fill(next);
  await page.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(page.getByTestId("sent-to")).toHaveText(next);

  await followEmailLink(page, next);
  await expect(page.getByTestId("new-email")).toHaveText(next);
  await page.getByRole("button", { name: "Confirm new email" }).click();
  await expect(page.getByRole("heading", { name: "Your email is changed" })).toBeVisible();

  await page.getByRole("link", { name: "Back to Settings" }).click();
  await expect(page.getByTestId("account-email")).toHaveText(next);
  // The old address is told; the confirmation link doesn't work twice.
  await page.goto("/dev/mail");
  await expect(page.getByTestId("dev-mail").filter({ hasText: email }).filter({ hasText: "Your email was changed" }).first()).toBeVisible();

  await logOut(page);
  await logIn(page, next);
  await expect(page).toHaveURL(/\/account$/);
});

test("lost inbox: the authenticator proves it's you; without one, support", async ({ page }) => {
  const email = uniqueEmail("lostbox");
  await signUp(page, "patient", email, "Iris", "Dale");

  // No two-step login: the only way is support.
  await page.goto("/account/settings");
  await emailRow(page).click();
  await page.getByRole("button", { name: "Can't access this email?" }).click();
  await expect(page.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", /\/account-recovery/);
  await page.keyboard.press("Escape");

  // Turn on two-step login, then use it in place of the inbox.
  await page.getByRole("link", { name: "Turn on" }).click();
  await page.getByLabel("Confirm your password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  const secret = (await page.getByTestId("totp-key").textContent())!.replace(/\s/g, "");
  await page.getByLabel("Code from your app").fill(totp(secret));
  await page.getByRole("button", { name: "Turn on two-step login" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("link", { name: "Continue" }).click();

  await page.goto("/account/settings");
  await emailRow(page).click();
  await page.getByRole("button", { name: "Can't access this email?" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Use your authenticator instead" })).toBeVisible();
  await dialog.getByLabel("Your password").fill(TEST_PASSWORD);
  await dialog.getByLabel("Code from your app").fill(totp(secret) === "000000" ? "111111" : "000000");
  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(dialog.getByText("That code didn't work")).toBeVisible();
  await dialog.getByLabel("Your password").fill(TEST_PASSWORD);
  await dialog.getByLabel("Code from your app").fill(totp(secret));
  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose your new email" })).toBeVisible();
});

test("account recovery: support moves the account, then a new password", async ({ page, browser }) => {
  const email = uniqueEmail("closedbox");
  const next = uniqueEmail("rescued");
  await signUp(page, "patient", email, "Theo", "Marsh");
  await logOut(page);

  await page.goto("/forgot-password");
  await page.getByRole("link", { name: "Get help from support" }).click();
  await expect(page.getByRole("heading", { name: "Can't access your email?" })).toBeVisible();
  await page.getByLabel("The email on your account").fill(email);
  await page.getByLabel("A new email we can reach you at").fill(next);
  await page.getByLabel("Full name").fill("Theo Marsh");
  // Providers must attach an ID.
  await page.getByRole("radio", { name: "I'm a provider on PsychMind" }).click();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Add a photo of your government ID.")).toBeVisible();
  await page.getByRole("radio", { name: "I use PsychMind to find care" }).click();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("recovery-sent-to")).toHaveText(next, { timeout: 30_000 });

  // The account's own inbox gets a heads-up.
  await page.goto("/dev/mail");
  await expect(page.getByTestId("dev-mail").filter({ hasText: email }).filter({ hasText: "Someone asked to move" }).first()).toBeVisible();

  const admin = await adminPage(browser);
  await admin.goto("/admin/recovery");
  await admin.getByRole("row").filter({ hasText: email }).getByRole("link").click();
  await expect(admin.getByText(next).first()).toBeVisible();
  await admin.getByRole("button", { name: "Move account" }).click();
  await admin.getByRole("button", { name: "Move account and email them" }).click();
  await expect(admin.getByText("The account was moved to the new email.")).toBeVisible({ timeout: 30_000 });
  await admin.context().close();

  await followEmailLink(page, next);
  await expect(page.getByLabel("New password")).toBeVisible();
  await page.getByLabel("New password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByText("Your password was updated.")).toBeVisible();
  await logIn(page, next, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/account$/);
});
