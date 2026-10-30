import { expect, test, type Page } from "@playwright/test";
import { fillBirthDate, followEmailLink, signUp, TEST_PASSWORD, uniqueEmail } from "./fixtures";

// The log-in and sign-up edges: an email that already has an account,
// logging in before confirming, the whole "Forgot your password?" flow
// (including a used link), unknown emails, and role mismatches.
// Against the local app (PGlite + /dev/mail).

test.skip(({ isMobile }) => isMobile, "Account flows run on desktop; layouts are covered elsewhere.");
test.setTimeout(120_000);

const NEW_PASSWORD = "Steady-Compass-2026!";

async function logIn(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

async function fillSignUp(page: Page, role: "patient" | "provider", email: string) {
  await page.goto(`/signup/${role}`);
  await page.getByLabel("First name").fill("Rae");
  await page.getByLabel("Last name").fill("Quinn");
  await page.getByLabel("Email").fill(email);
  await fillBirthDate(page);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
}

test("signing up again with the same email doesn't make a second account", async ({ page, browser }) => {
  const email = uniqueEmail("twice");
  await signUp(page, "provider", email, "Rae", "Quinn");

  const other = await (await browser.newContext()).newPage();
  await fillSignUp(other, "patient", email);
  // The form answers like any sign-up, so it reveals nothing about the
  // account; the owner is emailed to log in or reset instead.
  await expect(other.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await expect(async () => {
    await other.goto("/dev/mail");
    await expect(other.getByTestId("dev-mail").filter({ hasText: email }).filter({ hasText: "You already have a PsychMind account" }).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  await other.context().close();

  // The original account still logs in with its own password, as a provider.
  await page.context().clearCookies();
  await logIn(page, email);
  await expect(page).toHaveURL(/\/provider/);
});

test("logging in before confirming the email goes to the confirm screen, with resend", async ({ page }) => {
  const email = uniqueEmail("unconfirmed");
  await fillSignUp(page, "patient", email);
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();

  await page.context().clearCookies();
  await logIn(page, email);
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await expect(page.getByTestId("sent-to")).toHaveText(email);

  // Confirming signs them in.
  await followEmailLink(page, email);
  await expect(page).toHaveURL(/\/account/);
});

test("a confirmation link that's broken, expired or already used says so on log in", async ({ page }) => {
  // A link that doesn't check out: Better Auth sends it back with ?error=.
  await page.goto(`/api/auth/verify-email?token=not-a-token&callbackURL=${encodeURIComponent("/auth/verified?next=/account")}`);
  await expect(page).toHaveURL(/\/login\?link=invalid/);
  await expect(page.getByText("That confirmation link didn't work. Log in to get a new one.")).toBeVisible();

  // An expired one, as Better Auth hands it over.
  await page.goto("/auth/verified?next=%2Faccount&error=TOKEN_EXPIRED");
  await expect(page.getByText("That confirmation link has expired. Log in to get a new one.")).toBeVisible();

  // The real link, opened again once confirmed and signed out.
  const email = uniqueEmail("link-twice");
  await fillSignUp(page, "patient", email);
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await followEmailLink(page, email);
  await expect(page).toHaveURL(/\/account/);
  await page.context().clearCookies();
  await followEmailLink(page, email);
  await expect(page.getByText("Your email is confirmed. Log in to continue.")).toBeVisible();
  // …and logging in carries on to where the link was going.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
});

test("forgot password: link, new password, and the link only works once", async ({ page }) => {
  const email = uniqueEmail("forgot");
  await signUp(page, "patient", email, "Ivy", "Lane");
  await page.context().clearCookies();

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("heading", { name: "Link sent" })).toBeVisible();

  // Remember the link so it can be tried twice.
  await expect(async () => {
    await page.goto("/dev/mail");
    await expect(page.getByTestId("dev-mail").filter({ hasText: email }).filter({ hasText: "Reset your password" }).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  const link = (await page
    .getByTestId("dev-mail")
    .filter({ hasText: email })
    .filter({ hasText: "Reset your password" })
    .first()
    .getByTestId("dev-mail-link")
    .first()
    .getAttribute("href"))!;

  await page.goto(link);
  await page.getByLabel("New password").fill("short");
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByText("Must be at least 8 characters long.")).toBeVisible();
  await page.getByLabel("New password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByText("Your password was updated.")).toBeVisible();

  // The old password is gone, the new one works.
  await logIn(page, email);
  await expect(page.getByText("don't match")).toBeVisible();
  await logIn(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/account$/);

  // A used link explains itself.
  await page.context().clearCookies();
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
});

test("forgot password for an unknown email answers the same (no account is revealed)", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("heading", { name: "Link sent" })).toBeVisible();
});

test("an unknown email and a wrong password get the same message", async ({ page }) => {
  await logIn(page, uniqueEmail("ghost"));
  await expect(page.getByText("That email and password don't match")).toBeVisible();
});

test("each role lands in its own area; other areas send them home", async ({ page }) => {
  const email = uniqueEmail("rolecheck");
  await signUp(page, "patient", email, "Noa", "Field");
  await page.goto("/provider");
  await expect(page).toHaveURL(/\/account/);
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin(?!\/login)/);
});
