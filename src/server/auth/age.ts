import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AGE_OK_SECONDS } from "@/lib/age";

// The proof that someone passed the age screen just before "Continue with
// Google". Google sign-up has no form of ours, so the screen runs first and
// leaves this short-lived signed cookie; the user-create hook in ./index.ts
// refuses a new Google account without it. It holds only an expiry time.

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("BETTER_AUTH_SECRET is not set.");
  return value || "psychmind-dev-only-secret";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(`age-ok:${payload}`).digest("base64url");

export function ageOkToken(now = Date.now()) {
  const expires = String(now + AGE_OK_SECONDS * 1000);
  return `${expires}.${sign(expires)}`;
}

export function isValidAgeOkToken(token: string | undefined | null, now = Date.now()) {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || !/^\d+$/.test(expires) || Number(expires) < now) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** A cookie's value from a raw Cookie header. */
export function readCookie(header: string | null | undefined, name: string) {
  for (const part of header?.split(";") ?? []) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
