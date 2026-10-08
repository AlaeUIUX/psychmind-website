import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

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
