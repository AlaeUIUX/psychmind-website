import "server-only";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailPreference } from "@/db/schema";
import { legalDetails } from "@/lib/legal";
import { sendEmail, type Email } from "./email";
import { appUrl } from "./url";

// The only way to send marketing email (newsletters, announcements, "come
// back" nudges — anything whose main purpose is promotion). CAN-SPAM
// (15 U.S.C. § 7704) needs, in every one:
// - the sender's postal address: send refuses without LEGAL_POSTAL_ADDRESS;
// - a working opt-out, honored within 10 business days: we honor it at once,
//   and every later send to that address is skipped;
// Gmail and Yahoo also require one-click unsubscribe headers (RFC 8058) from
// bulk senders. The link carries a random token, never the address.
// Transactional email (sign-up, resets, requests, billing) goes through
// sendEmail directly and isn't affected by an opt-out.

/** The unsubscribe token for an address, created on first use. */
async function tokenFor(address: string) {
  const email = address.trim().toLowerCase();
  const token = randomBytes(24).toString("base64url");
  const [row] = await db
    .insert(emailPreference)
    .values({ email, token })
    .onConflictDoUpdate({ target: emailPreference.email, set: { email: sql`excluded.email` } })
    .returning({ token: emailPreference.token, optedOut: emailPreference.marketingOptOutAt });
  return row;
}

export type MarketingResult = "sent" | "opted_out";

/** Sends one marketing email, built with its unsubscribe link (pass it to
 *  layout({ unsubscribeUrl })). Skips addresses that opted out. */
export async function sendMarketingEmail(to: string, build: (unsubscribeUrl: string) => Email): Promise<MarketingResult> {
  if (!legalDetails().postalAddress) {
    throw new Error("LEGAL_POSTAL_ADDRESS is not set; marketing email needs a postal address (CAN-SPAM).");
  }
  const { token, optedOut } = await tokenFor(to);
  if (optedOut) return "opted_out";
  const pageUrl = await appUrl(`/unsubscribe/${token}`);
  const oneClickUrl = await appUrl(`/api/unsubscribe/${token}`);
  const email = build(pageUrl);
  if (!email.html.includes(pageUrl)) throw new Error("Marketing email must show its unsubscribe link (layout({ unsubscribeUrl })).");
  await sendEmail({
    ...email,
    to,
    headers: {
      ...email.headers,
      "List-Unsubscribe": `<${oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  return "sent";
}

/** Opts the address behind `token` out of marketing email. False for an unknown token. */
export async function unsubscribe(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return false;
  const [row] = await db
    .update(emailPreference)
    .set({ marketingOptOutAt: sql`coalesce(${emailPreference.marketingOptOutAt}, now())` })
    .where(eq(emailPreference.token, token))
    .returning({ email: emailPreference.email });
  return Boolean(row);
}

/** Undo, from the same page ("Unsubscribed by mistake?"). */
export async function resubscribe(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return false;
  const [row] = await db
    .update(emailPreference)
    .set({ marketingOptOutAt: null })
    .where(eq(emailPreference.token, token))
    .returning({ email: emailPreference.email });
  return Boolean(row);
}

export async function isUnsubscribed(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db
    .select({ optedOut: emailPreference.marketingOptOutAt })
    .from(emailPreference)
    .where(eq(emailPreference.token, token));
  return row ? Boolean(row.optedOut) : null;
}
