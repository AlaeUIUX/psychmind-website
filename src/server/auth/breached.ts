import "server-only";
import { createHash } from "node:crypto";

// Passwords known from data breaches (Have I Been Pwned's password list).
// Only the first 5 characters of the password's SHA-1 hash leave the server
// (k-anonymity), with padding so the response size reveals nothing. If the
// service is slow or down, the password is allowed: a check that can't run
// must never stop someone signing up or resetting (audit M1-23).

/** Copy approved by the owner, 2026-11-10. */
export const BREACHED_PASSWORD = "This password has appeared in a data breach elsewhere, so it's easy to guess. Please choose a different one.";

export async function isBreachedPassword(password: string): Promise<boolean> {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "PsychMind password check" },
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body.split("\n").some((line) => {
      const [hash, seen] = line.trim().split(":");
      return hash === suffix && Number(seen) > 0;
    });
  } catch {
    return false;
  }
}
