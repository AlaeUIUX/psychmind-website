import "server-only";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Local only: a fixed two-step code for the local admin (admin@psychmind.test),
// so demos don't need the authenticator app (owner request, 2026-11-05).
// Typing DEMO_ADMIN_CODE turns into the admin's real current code, read from
// the e2e secret kept next to the PGlite snapshot (.data/e2e-admin-totp.txt).
// The real check still runs: for any other account the code is simply wrong.
// Never in production builds.

export const DEMO_ADMIN_CODE = "424242";
const SECRET_FILE = path.join(process.cwd(), ".data", "e2e-admin-totp.txt");

function totp(base32Secret: string, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of base32Secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

/** The code to check: the local admin's current code when `code` is the demo code, else `code`. */
export function demoAdminCode(code: string) {
  if (process.env.NODE_ENV === "production" || code !== DEMO_ADMIN_CODE || !existsSync(SECRET_FILE)) return code;
  return totp(readFileSync(SECRET_FILE, "utf8").trim());
}
