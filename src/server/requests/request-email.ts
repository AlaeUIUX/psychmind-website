import "server-only";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { auditLog, providerProfile } from "@/db/schema";
import { displayName } from "@/lib/provider/display";
import { consumeToken, issueToken, readToken } from "@/server/account/tokens";
import { sendEmail } from "@/server/email";
import { requestEmailConfirmEmail } from "@/server/emails";
import { appUrl } from "@/server/url";

// A provider's requests address (Settings → "Send session requests to").
// Requests carry patients' names, contact details and notes, so a new address
// is only held (provider_profile.request_email_pending) until its inbox
// confirms it; requests keep going to the confirmed address, or the account
// email, until then. request_email is only ever written here, on confirmation.
//
// The link works signed out and whoever is signed in: the address is often an
// assistant's or the practice's, not the provider's own, and the provider
// already proved the account by choosing it in Settings. The link opens a page
// with a button, so mail scanners can't spend it.

// 24 hours, not change-email's 30 minutes: someone else may read this inbox.
const LINK_TTL = 24 * 60 * 60;

type Pending = { profileId: string; email: string };

const parse = (value: string | null): Pending | null => {
  if (!value) return null;
  try {
    const v = JSON.parse(value) as Pending;
    return typeof v.profileId === "string" && typeof v.email === "string" ? v : null;
  } catch {
    return null;
  }
};

async function profileOf(profileId: string) {
  await dbReady;
  const [p] = await db.select().from(providerProfile).where(eq(providerProfile.id, profileId));
  return p ?? null;
}

const nameOf = (p: typeof providerProfile.$inferSelect) =>
  displayName({ firstName: p.firstName, lastName: p.lastName, businessName: p.businessName, displayAsBusiness: p.displayAsBusiness } as never) || "A provider";

/** Holds `email` as the pending requests address and emails it a link (a new
 *  link replaces any earlier one). */
export async function startRequestEmail(profileId: string, email: string) {
  await dbReady;
  const [p] = await db.update(providerProfile).set({ requestEmailPending: email }).where(eq(providerProfile.id, profileId)).returning();
  if (!p) return;
  await sendRequestEmailLink(p);
}

/** Sends a fresh link to the pending address, if there is one. */
export async function resendRequestEmail(profileId: string) {
  const p = await profileOf(profileId);
  if (!p?.requestEmailPending) return false;
  await sendRequestEmailLink(p);
  return true;
}

async function sendRequestEmailLink(p: typeof providerProfile.$inferSelect) {
  const email = p.requestEmailPending!;
  const token = await issueToken("request-email", p.id, JSON.stringify({ profileId: p.id, email } satisfies Pending), LINK_TTL);
  await sendEmail(requestEmailConfirmEmail(email, nameOf(p), await appUrl(`/request-email/confirm?token=${token}`)));
}

/** Drops the pending address; the confirmed one (or the account email) stays. */
export async function cancelRequestEmail(profileId: string) {
  await dbReady;
  await db.update(providerProfile).set({ requestEmailPending: null }).where(eq(providerProfile.id, profileId));
}

/** Back to a confirmed address (or the account email when null) at once. */
export async function setConfirmedRequestEmail(profileId: string, email: string | null) {
  await dbReady;
  await db.update(providerProfile).set({ requestEmail: email, requestEmailPending: null }).where(eq(providerProfile.id, profileId));
}

/** The address and provider behind a link, without using it up. Null when the
 *  link is unknown, expired, or no longer the pending address (cancelled or
 *  replaced since). */
export async function pendingRequestEmail(token: string | undefined) {
  const pending = parse(await readToken("request-email", token));
  if (!pending) return null;
  const p = await profileOf(pending.profileId);
  if (!p || p.requestEmailPending !== pending.email) return null;
  return { email: pending.email, providerName: nameOf(p), providerUserId: p.userId };
}

/** The button on the confirm page: spends the link and makes the address live. */
export async function confirmRequestEmail(token: string) {
  const pending = parse(await consumeToken("request-email", token));
  if (!pending) return null;
  const p = await profileOf(pending.profileId);
  if (!p || p.requestEmailPending !== pending.email) return null;
  await db.transaction(async (tx) => {
    await tx.update(providerProfile).set({ requestEmail: pending.email, requestEmailPending: null }).where(eq(providerProfile.id, p.id));
    // Confirmed from the inbox, by whoever reads it: no actor.
    await tx.insert(auditLog).values({ actorId: null, action: "provider.request_email_confirmed", targetType: "provider_profile", targetId: p.id });
  });
  return { email: pending.email, providerName: nameOf(p), providerUserId: p.userId };
}
