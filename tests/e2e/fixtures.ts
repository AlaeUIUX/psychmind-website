import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, type Browser, type Page } from "@playwright/test";

// Test-only values for the local app (PGlite database, /dev/mail outbox).
// Never real accounts: the .test domain can't receive mail.
export const TEST_PASSWORD = "Calm-Harbor-2026!";
export const ADMIN_EMAIL = "admin@psychmind.test"; // matches ADMIN_EMAILS in .env.local
export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@psychmind.test`;

/** RFC 6238 code (SHA-1, 30 s, 6 digits) — what an authenticator app shows. */
export function totp(base32Secret: string, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of base32Secret.replace(/[\s=]/g, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const value = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return value.toString().padStart(6, "0");
}

/** The local admin's authenticator secret, kept next to the PGlite snapshot so
 *  later runs can log in (both reset together when .data is deleted). */
const ADMIN_TOTP_FILE = path.join(process.cwd(), ".data", "e2e-admin-totp.txt");
export const readAdminSecret = () => (existsSync(ADMIN_TOTP_FILE) ? readFileSync(ADMIN_TOTP_FILE, "utf8").trim() : null);
export const saveAdminSecret = (secret: string) => {
  mkdirSync(path.dirname(ADMIN_TOTP_FILE), { recursive: true });
  writeFileSync(ADMIN_TOTP_FILE, secret);
};

/** Opens the newest email sent to `email` in the dev mailbox and follows its first link. */
export async function followEmailLink(page: Page, email: string) {
  await expect(async () => {
    await page.goto("/dev/mail");
    await expect(page.getByTestId("dev-mail").filter({ hasText: email }).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  const href = await page.getByTestId("dev-mail").filter({ hasText: email }).first().getByTestId("dev-mail-link").first().getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
}

export async function signUp(page: Page, role: "patient" | "provider", email: string, first: string, last: string) {
  await page.goto(`/signup/${role}`);
  await page.getByLabel("First name").fill(first);
  await page.getByLabel("Last name").fill(last);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  await followEmailLink(page, email);
}

/** Admins must use two-step login: sets it up on first use, then enters codes. */
async function setUpTwoFactor(page: Page) {
  await page.getByLabel("Confirm your password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  const key = (await page.getByTestId("totp-key").textContent())!.replace(/\s/g, "");
  saveAdminSecret(key);
  await page.getByLabel("Code from your app").fill(totp(key));
  await page.getByRole("button", { name: "Turn on two-step login" }).click();
  await expect(page.getByRole("heading", { name: "Save your backup codes" })).toBeVisible();
  await expect(page.getByTestId("backup-codes").locator("li")).toHaveCount(10);
  await page.getByRole("checkbox").check();
  await page.getByRole("link", { name: "Continue" }).click();
}

export async function logIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

const TEMP_PASSWORD = /[A-HJKMNP-Z2-9]{4}(?:-[A-HJKMNP-Z2-9]{4}){3}/;

/** The temporary password in the newest admin-access email to `email`. */
export async function latestTemporaryPassword(page: Page, email: string): Promise<string | null> {
  await page.goto("/dev/mail");
  const mail = page.getByTestId("dev-mail").filter({ hasText: email }).filter({ hasText: "Temporary password" }).first();
  if (!(await mail.count())) return null;
  return (await mail.getByTestId("dev-mail-text").textContent())?.match(TEMP_PASSWORD)?.[0] ?? null;
}

/** Waits for an admin-access email newer than the one holding `previous`. */
export async function newTemporaryPassword(page: Page, email: string, previous: string | null) {
  let temp: string | null = null;
  await expect(async () => {
    temp = await latestTemporaryPassword(page, email);
    expect(temp).toBeTruthy();
    expect(temp).not.toBe(previous);
  }).toPass({ timeout: 15_000 });
  return temp!;
}

/** A new admin's first step: their name and their own password. */
export async function choosePassword(page: Page, first: string, last: string, password: string) {
  await expect(page.getByRole("heading", { name: "Choose your password" })).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("First name").fill(first);
  await page.getByLabel("Last name").fill(last);
  await page.getByLabel("New password").fill(password);
  await page.getByRole("button", { name: "Save and continue" }).click();
}

/** The last admin session, so a run doesn't log in (and enter a two-step
 *  code) for every test: codes are rate-limited per IP, and every test comes
 *  from the same one. Lives with the database, like the secret. */
const ADMIN_STATE_FILE = path.join(process.cwd(), ".data", "e2e-admin-state.json");

/** A signed-in admin (created and given two-step login on first use). */
export async function adminPage(browser: Browser) {
  if (existsSync(ADMIN_STATE_FILE)) {
    try {
      const context = await browser.newContext({ storageState: ADMIN_STATE_FILE });
      const page = await context.newPage();
      await page.goto("/admin");
      const queue = page.getByRole("heading", { level: 1, name: "Verification queue" });
      const login = page.getByRole("heading", { level: 1, name: "Log in to PsychMind" });
      await expect(queue.or(login)).toBeVisible({ timeout: 15_000 });
      if (await queue.isVisible()) return page;
      await context.close(); // expired: log in again
    } catch {
      // Unreadable state: log in again.
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  // Opening the admin log-in also creates listed admins' accounts.
  await page.goto("/admin/login");
  await logIn(page, ADMIN_EMAIL, TEST_PASSWORD);
  const failed = page.getByText("don't match");
  const queue = page.getByRole("heading", { level: 1, name: "Verification queue" });
  const setup = page.getByRole("heading", { name: "Set up two-step login" });
  const challenge = page.getByRole("heading", { name: "Two-step verification" });
  await expect(failed.or(queue).or(setup).or(challenge)).toBeVisible({ timeout: 15_000 });
  if (await failed.isVisible()) {
    // First run: the account was just made, with a temporary password by email.
    const temp = await newTemporaryPassword(page, ADMIN_EMAIL, null);
    await page.goto("/admin/login");
    await logIn(page, ADMIN_EMAIL, temp);
    await choosePassword(page, "Brenda", "Admin", TEST_PASSWORD);
  }
  if (await challenge.isVisible()) {
    await page.getByLabel("Authentication code").fill(totp(readAdminSecret()!));
    await page.getByRole("button", { name: "Verify" }).click();
  }
  await expect(queue.or(setup)).toBeVisible({ timeout: 15_000 });
  if (await setup.isVisible()) await setUpTwoFactor(page);
  await expect(queue).toBeVisible({ timeout: 15_000 });
  // Written whole, then renamed: parallel workers never read half a file.
  const tmp = `${ADMIN_STATE_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(await context.storageState()));
  renameSync(tmp, ADMIN_STATE_FILE);
  return page;
}
