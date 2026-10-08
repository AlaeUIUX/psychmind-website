import { expect, test, type Browser, type Page } from "@playwright/test";
import path from "node:path";
import { ADMIN_EMAIL, TEST_PASSWORD, uniqueEmail } from "./fixtures";

// The full provider journey against the local app (PGlite + /dev/mail):
// sign up → verify email → 9-step onboarding with uploads → submit →
// admin approves → provider sees "You're verified" and billing.
// Runs once (desktop); it's a long, stateful flow.

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "Full flow runs on desktop; mobile layouts are covered elsewhere.");
test.setTimeout(180_000);

const PHOTO = path.join(process.cwd(), "public/images/how-it-works/avatar-1.png");
const PDF = { name: "Texas-LPC-license.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test license\n%%EOF\n") };

/** Opens the newest email sent to `email` in the dev mailbox and follows its first link. */
async function followEmailLink(page: Page, email: string) {
  await expect(async () => {
    await page.goto("/dev/mail");
    await expect(page.getByTestId("dev-mail").filter({ hasText: email }).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  const href = await page.getByTestId("dev-mail").filter({ hasText: email }).first().getByTestId("dev-mail-link").first().getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
}

async function signUp(page: Page, role: "patient" | "provider", email: string, first: string, last: string) {
  await page.goto(`/signup/${role}`);
  await page.getByLabel("First name").fill(first);
  await page.getByLabel("Last name").fill(last);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await followEmailLink(page, email);
}

async function saveAndContinue(page: Page, nextHeading: string | RegExp) {
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nextHeading })).toBeVisible({ timeout: 15_000 });
}

async function adminPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // First run: the admin account doesn't exist yet — create it.
  const failed = page.getByText("don't match");
  const queue = page.getByRole("heading", { level: 1, name: "Verification queue" });
  await expect(failed.or(queue)).toBeVisible({ timeout: 15_000 });
  if (await failed.isVisible()) {
    await signUp(page, "patient", ADMIN_EMAIL, "Brenda", "Admin");
  }
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Verification queue" })).toBeVisible();
  return page;
}

test("provider signs up, onboards, gets approved and reaches billing", async ({ page, browser }) => {
  const email = uniqueEmail("provider");
  const last = `Tester${Date.now() % 100000}`;

  await test.step("sign up and verify email", async () => {
    await signUp(page, "provider", email, "Sara", last);
    await expect(page.getByRole("heading", { name: "Reach people who are ready to start" })).toBeVisible();
    await page.getByRole("link", { name: "Get started" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Your identity" })).toBeVisible();
  });

  await test.step("1 identity — validation, then save", async () => {
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page.getByText("Title / credentials is required.")).toBeVisible();
    await page.getByLabel(/Title \/ credentials/).fill("Counselor, LMHC, M.S.");
    await page.getByLabel("Pronouns").fill("she/her");
    // Live preview updates as you type.
    await expect(page.locator("aside").getByText("Counselor, LMHC, M.S.").first()).toBeVisible();
    await saveAndContinue(page, "Add a photo");
  });

  await test.step("2 picture upload", async () => {
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    await expect(page.getByRole("img", { name: "Your profile picture" })).toBeVisible();
    await saveAndContinue(page, "Your story");
  });

  await test.step("3 story", async () => {
    await page.getByLabel(/Who you work with/).fill("I work with adults navigating anxiety and big life changes.");
    await page.getByLabel(/About you/).fill("My approach is collaborative and paced to your comfort.");
    await saveAndContinue(page, "Who you work with");
  });

  await test.step("4 who you work with", async () => {
    await page.getByRole("button", { name: "Individuals", exact: true }).click();
    await page.getByRole("button", { name: "Adults +18", exact: true }).click();
    await saveAndContinue(page, "Your expertise");
    await expect(page).toHaveURL(/onboarding\/expertise/);
  });

  await test.step("5 expertise with a custom specialty", async () => {
    await page.getByRole("button", { name: "Anxiety", exact: true }).click();
    await page.getByRole("textbox", { name: "Add more" }).first().fill("Perinatal mental health");
    await page.getByRole("button", { name: "Add specialty" }).click();
    await page.getByRole("button", { name: "CBT", exact: true }).click();
    await saveAndContinue(page, "Fees & background");
  });

  await test.step("6 fees & background", async () => {
    await page.getByLabel(/Individual session/).fill("120");
    await saveAndContinue(page, "Practice locations");
  });

  await test.step("7 locations", async () => {
    await page.getByRole("combobox", { name: /State/ }).click();
    await page.getByRole("option", { name: "Texas" }).click();
    await page.getByLabel(/City/).fill("Austin");
    await page.getByLabel("ZIP code").fill("78701");
    await saveAndContinue(page, "Credentials & verification");
  });

  await test.step("8 credentials with license upload", async () => {
    await page.getByLabel(/NPI number/).fill("12345");
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page.getByText("An NPI number is 10 digits.")).toBeVisible();
    await page.getByLabel(/NPI number/).fill("1234567893");
    await page.locator('input[type="file"]').setInputFiles(PDF);
    await expect(page.getByText(PDF.name)).toBeVisible();
    await page.getByLabel(/License number/).fill("LPC-77812");
    await page.getByLabel(/Issuing body/).fill("Texas Behavioral Health Executive Council");
    await saveAndContinue(page, "Review and submit");
  });

  await test.step("9 review and submit", async () => {
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit for verification" }).click();
    await expect(page.getByRole("heading", { name: /Submitted\. We.re reviewing your profile/ })).toBeVisible({ timeout: 15_000 });
    // The address is masked on screen and never put in the URL.
    expect(page.url()).not.toContain("@");
  });

  await test.step("admin approves", async () => {
    const admin = await adminPage(browser);
    await admin.getByRole("link", { name: new RegExp(`Sara ${last}`) }).click();
    await expect(admin.getByText("License #LPC-77812 · Texas Behavioral Health Executive Council")).toBeVisible();
    await admin.getByRole("button", { name: "Approve", exact: true }).click();
    await admin.getByRole("button", { name: "Confirm decision" }).click();
    await expect(admin.getByText("Decision saved")).toBeVisible();
    await admin.context().close();
  });

  await test.step("provider is verified and can see billing", async () => {
    await page.goto("/provider");
    await expect(page.getByText("You're verified")).toBeVisible();
    await page.getByRole("link", { name: "Activate your listing" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Billing" })).toBeVisible();
    await expect(page.getByText("Payments aren't connected yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Activate your listing" })).toBeDisabled();
  });

  await test.step("provider can edit any field afterwards", async () => {
    await page.goto("/provider/profile?section=story");
    await page.getByLabel(/About you/).fill("Updated: collaborative, warm and direct.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  });
});

test("signed-out visitors are sent to log in, then back", async ({ page }) => {
  await page.goto("/provider/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprovider%2Fprofile/);
});

test("wrong password shows an inline error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@psychmind.test");
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("That email and password don't match. Please try again.")).toBeVisible();
});
