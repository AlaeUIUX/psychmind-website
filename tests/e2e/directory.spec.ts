import { expect, test, type Page } from "@playwright/test";
import { adminPage, followEmailLink, TEST_PASSWORD, uniqueEmail } from "./fixtures";

// The directory with the 50 sample providers (seeded by migration 0007, or
// added by the admin): search with filters, the quick look over the results,
// the full profile in a new tab (its link ends in the public id), and saving
// (a prompt when signed out, the account page for patients).

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

const count = (page: Page) => page.getByRole("status").filter({ hasText: /providers? found/ }).first();

test("a result opens a quick look over the page; the full profile opens in a new tab", async ({ page }) => {
  await page.goto("/providers");
  await expect(count(page)).toHaveText(/\d+ providers found/);
  await expect(page.getByText("These are sample profiles.")).toBeVisible();

  await page.getByTestId("provider-card").filter({ hasText: "Sara Oliisi" }).getByRole("button", { name: "Preview Sara Oliisi" }).click();
  await expect(page).toHaveURL(/[?&]p=[a-z0-9]{8}/);
  const look = page.getByRole("dialog", { name: "Quick look: Sara Oliisi" });
  await expect(look.getByRole("heading", { name: "Sara Oliisi", exact: true })).toBeVisible();
  await expect(look.getByText("Florida", { exact: true })).toBeVisible();
  await expect(look.getByText("Sample profile")).toBeVisible();

  // Step to the next result without closing.
  await look.getByRole("button", { name: "Next provider" }).click();
  await expect(page.getByRole("dialog")).not.toHaveAccessibleName("Quick look: Sara Oliisi");
  await page.getByRole("dialog").getByRole("button", { name: "Previous provider" }).click();
  await expect(page.getByRole("dialog", { name: "Quick look: Sara Oliisi" })).toBeVisible();

  const full = page.getByRole("dialog").getByRole("link", { name: /See full profile/ });
  await expect(full).toHaveAttribute("target", "_blank");
  expect(await full.getAttribute("href")).toMatch(PROFILE);
  const [profile] = await Promise.all([page.context().waitForEvent("page"), full.click()]);
  await expect(profile).toHaveURL(PROFILE);
  await expect(profile.getByRole("heading", { level: 1, name: "Sara Oliisi" })).toBeVisible();
  await profile.close();

  // Closing returns to the results.
  await page.getByRole("button", { name: "Close and go back to results" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/[?&]p=/);
});

test("filters narrow the results and live in the URL", async ({ page, isMobile }) => {
  test.skip(isMobile, "The phone drawer has its own test.");
  await page.goto("/providers");
  const all = Number((await count(page).textContent())!.match(/\d+/)![0]);

  await page.getByRole("complementary", { name: "Filters" }).getByRole("checkbox", { name: "Depression" }).click();
  await expect(page).toHaveURL(/specialty=depression/);
  await expect(page.getByRole("button", { name: "Remove Depression" })).toBeVisible();
  const depression = Number((await count(page).textContent())!.match(/\d+/)![0]);
  expect(depression).toBeLessThan(all);

  // Online needs the patient's state (licensing).
  await page.getByRole("search").getByRole("radio", { name: "Online" }).click();
  await expect(page.getByText(/Add your state to see who can work with you online/)).toBeVisible();
  await page.getByRole("search").getByRole("combobox", { name: "Your state" }).click();
  await page.getByRole("option", { name: "New York" }).click();
  await expect(page).toHaveURL(/where=NY/);
  await expect(page.getByTestId("provider-card").first()).toContainText("Online in New York");

  // In-person near a place.
  await page.getByRole("button", { name: "Clear all" }).first().click();
  await expect(page).not.toHaveURL(/specialty=/);
  await page.getByRole("search").getByRole("radio", { name: "In-person" }).click();
  await page.getByRole("search").getByRole("combobox", { name: "Where?" }).fill("Miami");
  await page.getByRole("option", { name: "Miami, FL" }).click();
  await expect(page).toHaveURL(/where=Miami/);
  await expect(async () => {
    const cards = await page.getByTestId("provider-card").allTextContents();
    expect(cards.length).toBeGreaterThan(0);
    for (const text of cards) expect(text).toContain(", FL");
  }).toPass();

  // Everyday words find the matching specialty.
  await page.getByRole("button", { name: "Clear all" }).first().click();
  await page.getByRole("search").getByRole("combobox", { name: "What's on your mind?" }).fill("panic attacks");
  await page.getByRole("search").getByRole("combobox", { name: "What's on your mind?" }).press("Enter");
  await expect(page).toHaveURL(/q=panic/);
  await expect(page.getByTestId("provider-card").first()).toBeVisible();
});

test("the home page search opens the results with what was chosen", async ({ page, isMobile }) => {
  if (isMobile) {
    // Phones: "Start search" goes straight to the filters drawer.
    await page.goto("/");
    await page.getByRole("button", { name: /Start search/ }).click();
    await expect(page.getByRole("dialog", { name: "Search filters" })).toBeVisible();
    return;
  }
  await page.goto("/");
  await page.locator("#hero-mind").fill("Anx");
  await page.locator("#hero-mind").press("Enter");
  await expect(page.getByRole("button", { name: "Clear “Anxiety”" })).toBeVisible();
  await page.getByRole("button", { name: "Add preferences" }).click();
  await page.getByRole("button", { name: "Female", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/providers\?format=online&q=Anxiety&gender=female/);
  await expect(count(page)).toHaveText(/[1-9]\d* providers? found/);
  await expect(page.getByRole("button", { name: "Remove Female" })).toBeVisible();
});

test("on phones, filters open in a drawer and apply on Save", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phones only.");
  await page.goto("/providers");
  await page.getByRole("button", { name: "Filters" }).click();
  const drawer = page.getByRole("dialog", { name: "Search filters" });
  await drawer.getByRole("radio", { name: "Online" }).click();
  await drawer.getByRole("checkbox", { name: "Anxiety" }).click();
  await expect(page).not.toHaveURL(/specialty=/);
  await drawer.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/format=online/);
  await expect(page).toHaveURL(/specialty=anxiety/);

  // The quick look is full screen; Back closes it.
  await page.getByRole("button", { name: /^Preview / }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/specialty=anxiety/);
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
  await expect(page.getByText(/Verified by PsychMind · Florida ·/)).toBeVisible();
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
