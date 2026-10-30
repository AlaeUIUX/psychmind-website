import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { adminPage, signUp, TEST_PASSWORD, uniqueEmail } from "./fixtures";

// The full provider journey against the local app (PGlite + /dev/mail):
// sign up → verify email → 9-step onboarding with uploads → submit →
// admin approves → provider is live: analytics, billing, a session request.
// Runs once (desktop); it's a long, stateful flow.

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "Full flow runs on desktop; mobile layouts are covered elsewhere.");
test.setTimeout(240_000);

const PHOTO = path.join(process.cwd(), "public/images/how-it-works/avatar-1.png");
const PDF = { name: "Texas-LPC-license.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test license\n%%EOF\n") };

async function saveAndContinue(page: Page, nextHeading: string | RegExp) {
  await page.getByRole("button", { name: "Save and continue" }).click();
  // Generous: saving (with uploads) is slow while the whole suite shares one dev server.
  await expect(page.getByRole("heading", { level: 1, name: nextHeading })).toBeVisible({ timeout: 30_000 });
}

/** The test provider, until the last step deletes them. */
let leftover: string | null = null;

// A failed run mustn't leave "Sara Tester…" listed in the local directory.
test.afterAll(async ({ browser }) => {
  if (!leftover) return;
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(leftover);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/\/provider/, { timeout: 15_000 });
    await page.goto("/provider/settings");
    await page.getByRole("button", { name: "Delete account" }).click();
    await page.getByLabel("Enter your password to confirm").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByText("Your account has been deleted.").waitFor({ timeout: 15_000 });
    leftover = null;
  } catch {
    // Best effort: the run already failed for its own reason.
  } finally {
    await context.close();
  }
});

test("provider signs up, onboards, gets approved and reaches billing", async ({ page, browser }) => {
  const email = uniqueEmail("provider");
  const last = `Tester${Date.now() % 100000}`;
  leftover = email;

  await test.step("sign up and verify email", async () => {
    await signUp(page, "provider", email, "Sara", last);
    await expect(page.getByRole("heading", { name: "Reach people who are ready to start" })).toBeVisible();
    await page.getByRole("link", { name: "Get started" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Your identity" })).toBeVisible();
  });

  await test.step("1 identity — validation, then save", async () => {
    await page.getByRole("button", { name: "Save and continue" }).click();
    // Inline under the field (the summary at the top repeats it).
    await expect(page.getByText("Title / credentials is required.", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "to fix before saving" })).toBeVisible();
    await page.getByLabel(/Title \/ credentials/).fill("Counselor, LMHC, M.S.");
    await page.getByLabel("Pronouns").fill("she/her");
    // Live preview updates as you type.
    await expect(page.locator("aside").getByText("Counselor, LMHC, M.S.").first()).toBeVisible();
    await saveAndContinue(page, "Add a photo");
  });

  await test.step("2 picture upload", async () => {
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    // The crop dialog opens first; the cropped square is what gets uploaded.
    const crop = page.getByRole("dialog", { name: "Crop your picture" });
    await expect(crop).toBeVisible();
    await expect(crop.getByRole("slider", { name: "Zoom" })).toBeVisible();
    await crop.getByRole("button", { name: "Use photo" }).click();
    await expect(crop).toBeHidden();
    await expect(page.getByRole("img", { name: "Your profile picture" })).toBeVisible();
    await expect(page.getByText(/avatar-1\.(webp|jpg)/)).toBeVisible();
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
    await expect(page.getByText("An NPI number is 10 digits.", { exact: true })).toBeVisible();
    await page.getByLabel(/NPI number/).fill("1234567893");
    // Hold the upload briefly: saving waits for it ("Uploading…", disabled).
    await page.route("**/api/uploads", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.locator('input[type="file"]').setInputFiles(PDF);
    await expect(page.getByText(PDF.name)).toBeVisible();
    await expect(page.getByRole("button", { name: "Uploading…" })).toBeDisabled();
    await expect(page.getByRole("progressbar", { name: `Uploading ${PDF.name}` })).toHaveCount(0);
    await page.unroute("**/api/uploads");
    await expect(page.getByRole("button", { name: "Save and continue" })).toBeEnabled();
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
    // From the home (Analytics), the sidebar opens the queue.
    await admin.getByRole("complementary", { name: "Sidebar" }).getByRole("link", { name: /Verification queue/ }).click();
    await expect(admin).toHaveURL(/\/admin\/queue$/);
    await admin.getByRole("link", { name: new RegExp(`Sara ${last}`) }).click();
    await expect(admin.getByText("License #LPC-77812 · Texas Behavioral Health Executive Council")).toBeVisible();
    await admin.getByRole("button", { name: "Approve", exact: true }).click();
    await admin.getByRole("button", { name: "Confirm decision" }).click();
    await expect(admin.getByText("Decision saved")).toBeVisible();
    await admin.context().close();
  });

  await test.step("provider is live, sees their overview, analytics and billing", async () => {
    // Overview: a greeting, account health and the last days at a glance.
    await page.goto("/provider");
    await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening), Sara$/ })).toBeVisible();
    // Until billing is connected, approval alone lists a provider.
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
    const health = page.getByRole("region", { name: "Account health" });
    await expect(health).toContainText("Live in search");
    await expect(health).toContainText("Verified");
    await expect(page.getByRole("region", { name: "Last 7 days" })).toBeVisible();
    await expect(page.getByRole("link", { name: /View public profile/ })).toBeVisible();
    // The sidebar takes them to Analytics.
    await page.getByRole("complementary", { name: "Sidebar" }).getByRole("link", { name: "Analytics" }).click();
    await expect(page).toHaveURL(/\/provider\/analytics$/);
    await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Overview" })).toBeVisible();
    await page.goto("/provider/billing");
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

  await test.step("a guest requests a session; the provider gets an email and sees it", async () => {
    const guestEmail = uniqueEmail("guest");
    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto("/providers");
    const href = await g.getByTestId("provider-card").filter({ hasText: `Sara ${last}` }).getByRole("link", { name: /See profile/ }).getAttribute("href");
    await g.goto(href!.replace("/providers/", "/request/"));
    await g.getByRole("button", { name: "Confirm" }).click();
    await expect(g.getByRole("heading", { name: "Session details" })).toBeVisible();
    await g.getByRole("button", { name: "Continue" }).click();
    await g.getByLabel(/Message/).fill("Looking for help with anxiety at work.");
    await g.getByRole("button", { name: "Continue" }).first().click();
    await g.getByRole("radio", { name: /Continue as guest/ }).click();
    await g.getByLabel("Your name").fill("Guest Patient");
    await g.getByLabel("Email").fill(guestEmail);
    await g.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(g.getByRole("heading", { name: "Review your request" })).toBeVisible();
    await g.getByRole("button", { name: "Confirm request" }).click();
    await expect(g.getByText("We sent an email on your behalf!")).toBeVisible({ timeout: 15_000 });

    // The same request again the same day isn't emailed twice.
    await g.goto(href!.replace("/providers/", "/request/"));
    await g.getByRole("button", { name: "Confirm" }).click();
    await g.getByRole("button", { name: "Continue" }).click();
    await g.getByRole("button", { name: "Skip for now" }).click();
    await g.getByRole("radio", { name: /Continue as guest/ }).click();
    await g.getByLabel("Your name").fill("Guest Patient");
    await g.getByLabel("Email").fill(guestEmail);
    await g.getByRole("button", { name: "Confirm", exact: true }).click();
    await g.getByRole("button", { name: "Confirm request" }).click();
    await expect(g.getByRole("heading", { name: `Sara already has your request` })).toBeVisible({ timeout: 15_000 });
    await guest.close();

    // One email to the provider (with the details), one confirmation to the guest.
    await page.goto("/dev/mail");
    const toProvider = page.getByTestId("dev-mail").filter({ hasText: "New session request" }).filter({ hasText: guestEmail });
    await expect(toProvider).toHaveCount(1);
    await expect(toProvider).toContainText("Looking for help with anxiety at work.");
    await expect(toProvider.getByTestId("dev-mail-to")).toHaveText(email);
    // Replying goes straight to the patient.
    await expect(toProvider.getByTestId("dev-mail-reply-to")).toHaveText(guestEmail);
    await expect(page.getByTestId("dev-mail").filter({ hasText: "Your request was sent" }).filter({ hasText: guestEmail })).toHaveCount(1);

    await page.goto("/provider/requests");
    const request = page.getByTestId("provider-request").filter({ hasText: "Guest Patient" }).first();
    await expect(request).toContainText(guestEmail);
    await request.getByRole("switch", { name: "Mark Guest Patient as contacted" }).click();
    // Let the save land before reloading (the switch flips at once, optimistically).
    await page.waitForLoadState("networkidle");
    await page.reload();
    await page.getByRole("tab", { name: /All/ }).click();
    await expect(page.getByRole("tabpanel").getByRole("switch", { name: "Mark Guest Patient as contacted" })).toBeChecked();
  });

  await test.step("with request emails turned off, requests still reach the inbox", async () => {
    await page.goto("/provider/settings");
    await page.getByRole("switch", { name: "New session requests" }).click();
    await expect(page.getByText("Turned off")).toBeVisible();

    const quietEmail = uniqueEmail("quiet");
    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto("/providers");
    const href = await g.getByTestId("provider-card").filter({ hasText: `Sara ${last}` }).getByRole("link", { name: /See profile/ }).getAttribute("href");
    await g.goto(href!.replace("/providers/", "/request/"));
    await g.getByRole("button", { name: "Confirm" }).click();
    await g.getByRole("button", { name: "Continue" }).click();
    await g.getByRole("button", { name: "Skip for now" }).click();
    await g.getByRole("radio", { name: /Continue as guest/ }).click();
    await g.getByLabel("Your name").fill("Quiet Patient");
    await g.getByLabel("Email").fill(quietEmail);
    await g.getByRole("button", { name: "Confirm", exact: true }).click();
    await g.getByRole("button", { name: "Confirm request" }).click();
    await expect(g.getByText("We sent an email on your behalf!")).toBeVisible({ timeout: 15_000 });
    await guest.close();

    await page.goto("/provider/requests");
    await expect(page.getByTestId("provider-request").filter({ hasText: "Quiet Patient" })).toBeVisible();
    await page.goto("/dev/mail");
    await expect(page.getByTestId("dev-mail").filter({ hasText: "Your request was sent" }).filter({ hasText: quietEmail })).toHaveCount(1);
    await expect(page.getByTestId("dev-mail").filter({ hasText: "New session request" }).filter({ hasText: quietEmail })).toHaveCount(0);

    await page.goto("/provider/settings");
    await page.getByRole("switch", { name: "New session requests" }).click();
    await expect(page.getByText("Turned on")).toBeVisible();
  });

  await test.step("analytics count patients finding the provider, never the provider", async () => {
    const stat = (name: string) => page.getByRole("group", { name }).locator('[data-slot="stat-value"]');
    // The provider looks at their own public profile: not counted.
    await page.goto("/provider");
    const profileHref = await page.getByRole("link", { name: /View public profile/ }).getAttribute("href");
    await page.goto(profileHref!);
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(`Sara ${last}`) })).toBeVisible();
    await page.goto("/provider/analytics"); // leaving sends the page's events

    // A guest finds them in search, takes a quick look, then opens the profile.
    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto("/providers?format=online&where=TX&specialty=anxiety");
    const card = g.getByTestId("provider-card").filter({ hasText: `Sara ${last}` });
    await card.scrollIntoViewIfNeeded();
    await g.waitForTimeout(1000); // an impression needs the card on screen for a moment
    await card.getByRole("button", { name: `Preview Sara ${last}` }).click();
    await expect(g.getByRole("dialog")).toBeVisible();
    await g.goto(profileHref!);
    await expect(g.getByRole("heading", { level: 1, name: new RegExp(`Sara ${last}`) })).toBeVisible();

    // One quick look plus one full profile; the two guests' requests from earlier.
    await expect(async () => {
      await page.reload();
      await expect(stat("Profile views")).toHaveText("2", { timeout: 1000 });
    }).toPass({ timeout: 30_000 });
    await expect(stat("Session requests")).toHaveText("2");
    expect(Number(await stat("Impressions").textContent())).toBeGreaterThanOrEqual(1);
    await expect(stat("Conversion rate")).toHaveText("100%");
    const recent = page.getByRole("region", { name: "Recent session requests" });
    await expect(recent).toContainText("Guest P.");
    await expect(recent.getByRole("link", { name: "2 total" })).toHaveAttribute("href", "/provider/requests");

    // Another range keeps the page and updates the address.
    await page.getByRole("radio", { name: "Last 30 days" }).click();
    await expect(page).toHaveURL(/\?range=30d$/);
    await expect(stat("Profile views")).toHaveText("2");
    await guest.close();

    // For reviewers: the dashboard on desktop and on a phone.
    for (const [name, width] of [["provider-analytics-desktop", 1280], ["provider-analytics-phone", 375]] as const) {
      await page.setViewportSize({ width, height: 900 });
      const file = test.info().outputPath(`${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await test.info().attach(name, { path: file, contentType: "image/png" });
    }
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  await test.step("View profile opens the whole profile in a new tab", async () => {
    await page.goto("/provider/profile");
    const view = page.getByRole("link", { name: "View profile" });
    await expect(view).toHaveAttribute("target", "_blank");
    const [preview] = await Promise.all([page.context().waitForEvent("page"), view.click()]);
    await expect(preview).toHaveURL(/\/provider\/preview$/);
    await expect(preview.getByRole("heading", { level: 1, name: `Sara ${last}`, exact: true })).toBeVisible();
    await expect(preview.getByText("Your profile as patients see it.")).toBeVisible();
    await preview.close();
  });

  // Once verified, a new name, title, NPI or license waits for our team; the
  // public profile keeps the verified details meanwhile (lib/provider/review.ts).
  const renamed = `${last}-Ray`;
  await test.step("a new name waits for the team, then goes live once approved", async () => {
    await page.goto("/provider");
    const profileHref = await page.getByRole("link", { name: /View public profile/ }).getAttribute("href");
    await page.goto("/provider/profile?section=identity");
    // Typing before the form has loaded its saved value would mix the two.
    await expect(page.getByLabel(/Last name/)).toHaveValue(last);
    await page.getByLabel(/Last name/).fill(renamed);
    await expect(page.getByLabel(/Last name/)).toHaveValue(renamed);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/^Saved\. Our team checks changes/)).toBeVisible();
    await expect(page.getByText("In review: last name.")).toBeVisible();

    // Patients still see the verified name.
    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto(profileHref!);
    await expect(g.getByRole("heading", { level: 1, name: `Sara ${last}`, exact: true })).toBeVisible();

    const admin = await adminPage(browser);
    await admin.goto("/admin/queue");
    await expect(admin.getByRole("row").filter({ hasText: `Sara ${last}` })).toContainText("Changes to review");
    await admin.getByRole("link", { name: new RegExp(`Sara ${last}`) }).first().click();
    await expect(admin.getByRole("heading", { name: "Changes to review" })).toBeVisible();
    await expect(admin.getByText(renamed, { exact: true })).toBeVisible();
    await admin.getByRole("button", { name: "Approve changes" }).click();
    await admin.getByRole("button", { name: "Confirm decision" }).click();
    await expect(admin.getByText("Decision saved")).toBeVisible();
    await admin.context().close();

    // Live now (the old link redirects to the new name).
    await g.goto(profileHref!);
    await expect(g.getByRole("heading", { level: 1, name: `Sara ${renamed}`, exact: true })).toBeVisible();
    await guest.close();
    await page.goto("/dev/mail");
    await expect(page.getByTestId("dev-mail").filter({ hasText: "Your PsychMind profile changes are live" }).filter({ hasText: email })).toHaveCount(1);
  });

  await test.step("a new state stays off the profile until its license is verified; a decline says why", async () => {
    await page.goto("/provider/profile?section=locations");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Add another location" }).click();
    // The new card (the second location).
    await page.locator("#loc-1-state").click();
    await page.getByRole("option", { name: "Florida" }).click();
    await page.locator("#loc-1-city").fill("Miami");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

    // Its license: the Florida card is the one still missing a license, so it's open.
    await page.goto("/provider/profile?section=credentials");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="file"]').setInputFiles({ ...PDF, name: "Florida-license.pdf" });
    await expect(page.getByText("Florida-license.pdf")).toBeVisible();
    await page.getByLabel(/License number/).fill("MH-1234");
    await page.getByLabel(/Issuing body/).fill("Florida Board of Clinical Social Work");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/^Saved\. Our team checks changes/)).toBeVisible();
    await expect(page.getByText("In review: the Florida license.")).toBeVisible();

    // Patients don't see Florida yet.
    await page.goto("/provider");
    const profileHref = await page.getByRole("link", { name: /View public profile/ }).getAttribute("href");
    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto(profileHref!);
    await expect(g.getByRole("heading", { level: 1, name: `Sara ${renamed}`, exact: true })).toBeVisible();
    await expect(g.getByText("Miami")).toHaveCount(0);
    await expect(g.getByText(/Licensed in .*Florida/)).toHaveCount(0);
    await guest.close();

    // The team declines, with a note the provider sees.
    const admin = await adminPage(browser);
    await admin.goto("/admin/queue");
    await admin.getByRole("link", { name: new RegExp(`Sara ${renamed}`) }).first().click();
    await expect(admin.getByText("New state", { exact: true })).toBeVisible();
    await admin.getByRole("button", { name: "Decline changes" }).click();
    await admin.getByLabel(/Note for the provider/).fill("The Florida license number doesn't match the board's record.");
    await admin.getByRole("button", { name: "Confirm decision" }).click();
    await expect(admin.getByText("Decision saved")).toBeVisible();
    await admin.context().close();

    await page.goto("/provider");
    await expect(page.getByText("We couldn't approve your recent changes")).toBeVisible();
    await expect(page.getByText("The Florida license number doesn't match the board's record.").first()).toBeVisible();
    await page.goto("/provider/profile?section=credentials");
    await expect(page.getByText("Not verified").first()).toBeVisible();
  });

  await test.step("provider deletes their account and their files go with it", async () => {
    await page.goto("/provider/profile?section=picture");
    const photo = await page.locator('img[src*="/api/files/"]').first().getAttribute("src");
    expect(photo).toBeTruthy();
    const photoPath = new URL(photo!, page.url()).pathname;
    const status = (p: Page = page) => p.evaluate(async (url) => (await fetch(url, { cache: "no-store" })).status, photoPath);
    expect(await status()).toBe(200);

    await page.goto("/provider/settings");
    await page.getByRole("button", { name: "Delete account" }).click();
    await page.getByLabel("Enter your password to confirm").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page.getByText("Your account has been deleted.")).toBeVisible();
    leftover = null;

    // The file no longer exists, even for an admin.
    expect(await status()).toBe(404);
    const admin = await adminPage(browser);
    expect(await status(admin)).toBe(404);
    await admin.context().close();
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
