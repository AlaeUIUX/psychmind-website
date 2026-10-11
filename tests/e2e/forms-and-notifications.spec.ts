import { expect, test, type Page } from "@playwright/test";
import { adminPage, signUp, uniqueEmail } from "./fixtures";

// The provider wizard's "Leave without saving?" warning and error summary,
// and Settings → Email notifications for each role. Against the local app.

test.skip(({ isMobile }) => isMobile, "Account flows run on desktop; layouts are covered elsewhere.");
test.setTimeout(150_000);

const leaveDialog = (page: Page) => page.getByRole("alertdialog", { name: "Leave without saving?" });

async function openIdentity(page: Page) {
  await page.goto("/provider/onboarding/identity");
  await expect(page.getByRole("heading", { level: 1, name: "Your identity" })).toBeVisible();
  // Typing before the page is interactive would be lost.
  await page.waitForLoadState("networkidle");
}

test("the wizard asks before leaving with unsaved changes, and can save on the way out", async ({ page }) => {
  await signUp(page, "provider", uniqueEmail("leaving"), "Lia", "Moss");

  // Save and leave: the change is kept.
  await openIdentity(page);
  await page.getByLabel(/Title \/ credentials/).fill("Counselor, LMHC");
  await page.getByRole("link", { name: "Save & exit" }).click();
  await expect(leaveDialog(page)).toBeVisible();
  await leaveDialog(page).getByRole("button", { name: "Save and leave" }).click();
  await expect(page).toHaveURL(/\/provider$/, { timeout: 30_000 });
  await openIdentity(page);
  await expect(page.getByLabel(/Title \/ credentials/)).toHaveValue("Counselor, LMHC");

  // Nothing changed: no question.
  await page.getByRole("link", { name: "Save & exit" }).click();
  await expect(page).toHaveURL(/\/provider$/);

  // The browser's Back button asks too (within the app; leaving the site gets
  // the browser's own prompt); staying keeps what was typed.
  await page.goto("/provider/onboarding/picture");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "Name & title" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your identity" })).toBeVisible();
  await page.getByLabel("Pronouns").fill("she/her");
  await page.goBack();
  await expect(leaveDialog(page)).toBeVisible();
  await leaveDialog(page).getByRole("button", { name: "Stay on this page" }).click();
  await expect(page).toHaveURL(/onboarding\/identity/);
  await expect(page.getByLabel("Pronouns")).toHaveValue("she/her");

  // Leave without saving: the change is dropped.
  await page.getByRole("link", { name: "Save & exit" }).click();
  await leaveDialog(page).getByRole("button", { name: "Leave without saving" }).click();
  await expect(page).toHaveURL(/\/provider$/);
  await openIdentity(page);
  await expect(page.getByLabel("Pronouns")).toHaveValue("");
});

test("a failed save lists what to fix at the top, and each line jumps to its field", async ({ page }) => {
  await signUp(page, "provider", uniqueEmail("summary"), "Ezra", "Vale");
  await openIdentity(page);
  await page.getByLabel(/First name/).fill("");
  await page.getByRole("button", { name: "Save and continue" }).click();

  const summary = page.getByRole("alert").filter({ hasText: "to fix before saving" });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("2 things to fix before saving");
  await expect(summary).toContainText("First name: First name is required.");
  await expect(summary).toContainText("Title / credentials: Title / credentials is required.");
  await summary.getByRole("button", { name: /Title \/ credentials/ }).click();
  await expect(page.getByLabel(/Title \/ credentials/)).toBeFocused();

  // Fixing them clears the summary on the next save.
  await page.getByLabel(/First name/).fill("Ezra");
  await page.getByLabel(/Title \/ credentials/).fill("Psychologist, PsyD");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Add a photo" })).toBeVisible({ timeout: 30_000 });
});

test("patients choose their emails in Settings, and it sticks", async ({ page }) => {
  await signUp(page, "patient", uniqueEmail("prefs"), "Ana", "Ruiz");
  await page.goto("/account/settings");
  const news = page.getByRole("switch", { name: "News and tips from PsychMind" });
  await expect(news).toBeChecked();
  await expect(page.getByText("the confirmation for each session request you send, always go out")).toBeVisible();
  await news.click();
  await expect(page.getByText("Turned off")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("switch", { name: "News and tips from PsychMind" })).not.toBeChecked();
});

test("providers and admins see their own email choices", async ({ page, browser }) => {
  await signUp(page, "provider", uniqueEmail("provprefs"), "Kai", "Lund");
  // Settings lives in the dashboard, which opens once the profile has a name.
  await openIdentity(page);
  await page.getByLabel(/Title \/ credentials/).fill("Therapist, LMFT");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Add a photo" })).toBeVisible({ timeout: 30_000 });
  await page.goto("/provider/settings");
  for (const name of ["New session requests", "Reminders to finish your profile", "News and tips from PsychMind"]) {
    await expect(page.getByRole("switch", { name })).toBeChecked();
  }
  await page.getByRole("switch", { name: "Reminders to finish your profile" }).click();
  await expect(page.getByText("Turned off")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Reminders to finish your profile" })).not.toBeChecked();

  const admin = await adminPage(browser);
  await admin.goto("/admin/settings");
  const recovery = admin.getByRole("switch", { name: "Account recovery requests" });
  await expect(admin.getByRole("switch", { name: "New providers to verify" })).toBeVisible();
  await expect(admin.getByRole("switch", { name: "New session requests" })).toHaveCount(0);
  // Flip and restore: the shared test admin keeps getting alerts.
  const wasOn = await recovery.isChecked();
  await recovery.click();
  await admin.reload();
  await expect(admin.getByRole("switch", { name: "Account recovery requests" })).toBeChecked({ checked: !wasOn });
  await admin.getByRole("switch", { name: "Account recovery requests" }).click();
  await admin.reload();
  await expect(admin.getByRole("switch", { name: "Account recovery requests" })).toBeChecked({ checked: wasOn });
  await admin.context().close();
});
