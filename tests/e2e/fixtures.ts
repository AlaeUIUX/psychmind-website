import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

/** A signed-in admin (created and given two-step login on first use). */
export async function adminPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // First run: the admin account doesn't exist yet — create it.
  const failed = page.getByText("don't match");
  const queue = page.getByRole("heading", { level: 1, name: "Verification queue" });
  const setup = page.getByRole("heading", { name: "Set up two-step login" });
  const challenge = page.getByRole("heading", { name: "Two-step verification" });
  await expect(failed.or(queue).or(setup).or(challenge)).toBeVisible({ timeout: 15_000 });
  if (await failed.isVisible()) {
    await signUp(page, "patient", ADMIN_EMAIL, "Brenda", "Admin");
    await page.goto("/admin");
  }
  if (await challenge.isVisible()) {
    await page.getByLabel("Authentication code").fill(totp(readAdminSecret()!));
    await page.getByRole("button", { name: "Verify" }).click();
  }
  await expect(queue.or(setup)).toBeVisible({ timeout: 15_000 });
  if (await setup.isVisible()) await setUpTwoFactor(page);
  await expect(queue).toBeVisible({ timeout: 15_000 });
  return page;
}
