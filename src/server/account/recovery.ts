import "server-only";
import { isAdminEmail } from "@/server/auth/admin-emails";
import { generateRandomString } from "better-auth/crypto";
import { and, asc, count, desc, eq, gt, isNotNull, max, ne } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { accountRecoveryRequest, auditLog, providerLicense, providerProfile, session as sessionTable, twoFactor, user } from "@/db/schema";
import { auth } from "@/server/auth";
import { requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import {
  adminRecoveryRequestEmail,
  recoveryCompletedEmail,
  recoveryConfirmContactEmail,
  recoveryDeclinedEmail,
  recoveryOwnerAlertEmail,
  recoveryReceivedEmail,
} from "@/server/emails";
import { optedOutOf } from "@/server/notifications";
import { deleteFile } from "@/server/storage";
import { appUrl } from "@/server/url";
import { applyEmailChange, checkNewEmail } from "./email-change";
import { consumeToken, issueToken, readToken } from "./tokens";

// Account recovery, for when someone can't get into their email anymore (a
// closed work address, a hacked inbox) and has no authenticator to prove it's
// them. A person on the team checks who they are, then moves the account to
// the new address and sends a link to choose a password. Providers send a
// photo ID (we have their license on file to compare); patients can too.
// The requester is never told whether an account matched.
//
// Safeguards (2026-11-10, audit M1-02):
// - the new contact address is confirmed by link before the request reaches
//   the team's queue or alerts anyone;
// - then the account's current address is told, with a one-click "This
//   wasn't me" that closes the request;
// - "Move account" waits RECOVERY_HOLD_HOURS after that, so the owner has
//   time to object (unless the request was made while signed in);
// - the team sees whether the account was used since the request;
// - decisions are claimed atomically, so two admins can't both act.

/** How long the account's owner has to object before it can be moved. */
export const RECOVERY_HOLD_HOURS = 72;
const CONTACT_LINK_TTL = 24 * 60 * 60;
const DISPUTE_LINK_TTL = 14 * 24 * 60 * 60;

/** When "Move account" opens up: the hold after the contact address was
 *  confirmed, or at once for a request made while signed in. */
export function recoveryMovableAt(request: { signedIn: boolean; contactVerifiedAt: Date | null }) {
  if (!request.contactVerifiedAt) return null;
  if (request.signedIn) return request.contactVerifiedAt;
  return new Date(request.contactVerifiedAt.getTime() + RECOVERY_HOLD_HOURS * 3_600_000);
}

export type RecoveryInput = {
  accountEmail: string;
  contactEmail: string;
  fullName: string;
  claimedRole: "patient" | "provider";
  licenseNumber: string | null;
  details: string | null;
  signedIn: boolean;
  idDocument: { storageKey: string; fileName: string; mimeType: string } | null;
};

/** Saves a request and sends the three emails: received (to the new
 *  address), a heads-up (to the account's address) and the staff alert. */
export async function createRecoveryRequest(input: RecoveryInput) {
  await dbReady;
  const [owner] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.email, input.accountEmail));
  const [row] = await db
    .insert(accountRecoveryRequest)
    .values({
      userId: owner?.id ?? null,
      accountEmail: input.accountEmail,
      contactEmail: input.contactEmail,
      fullName: input.fullName,
      claimedRole: input.claimedRole,
      licenseNumber: input.licenseNumber,
      details: input.details,
      signedIn: input.signedIn,
      idStorageKey: input.idDocument?.storageKey ?? null,
      idFileName: input.idDocument?.fileName ?? null,
      idMimeType: input.idDocument?.mimeType ?? null,
    })
    .returning({ id: accountRecoveryRequest.id });

  // First, the new address proves it's theirs; nothing else happens until then.
  const token = await issueToken("recovery-contact", row.id, row.id, CONTACT_LINK_TTL);
  await sendEmail(recoveryConfirmContactEmail(input.contactEmail, await appUrl(`/account-recovery/confirm?token=${token}`)));
  return row.id;
}

/** The request a still-valid contact link belongs to (for the confirm page). */
export async function recoveryForContactToken(token: string | undefined) {
  const id = await readToken("recovery-contact", token);
  if (!id) return null;
  const [row] = await db
    .select({ id: accountRecoveryRequest.id, contactEmail: accountRecoveryRequest.contactEmail, status: accountRecoveryRequest.status })
    .from(accountRecoveryRequest)
    .where(eq(accountRecoveryRequest.id, id));
  return row && row.status === "open" ? row : null;
}

/** The contact address is confirmed: the request joins the queue, the
 *  account's owner is alerted (with the dispute button), the team is told. */
export async function confirmRecoveryContact(token: string) {
  const id = await consumeToken("recovery-contact", token);
  if (!id) return null;
  const [row] = await db
    .update(accountRecoveryRequest)
    .set({ contactVerifiedAt: new Date() })
    .where(and(eq(accountRecoveryRequest.id, id), eq(accountRecoveryRequest.status, "open")))
    .returning();
  if (!row) return null;
  await db.insert(auditLog).values({ actorId: null, action: "account.recovery_contact_confirmed", targetType: "account_recovery_request", targetId: id });

  const [owner] = row.userId ? await db.select({ email: user.email }).from(user).where(eq(user.id, row.userId)) : [];
  // Only people still on ADMIN_EMAILS (someone taken off keeps the role until their next request).
  const allAdmins = (await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.role, "admin"))).filter((a) => isAdminEmail(a.email));
  const optedOut = await optedOutOf("admin_recovery", allAdmins.map((a) => a.id));
  const admins = allAdmins.filter((a) => !optedOut.has(a.id));
  const disputeToken = owner ? await issueToken("recovery-dispute", id, id, DISPUTE_LINK_TTL) : null;
  const [reviewUrl, settingsUrl, disputeUrl] = await Promise.all([
    appUrl(`/admin/recovery/${id}`),
    appUrl("/admin/settings"),
    disputeToken ? appUrl(`/account-recovery/dispute?token=${disputeToken}`) : null,
  ]);
  // One at a time: a burst of parallel sends can trip the email provider's rate limit.
  const sends: (() => Promise<void>)[] = [
    () => sendEmail(recoveryReceivedEmail(row.contactEmail)),
    ...(owner && disputeUrl ? [() => sendEmail(recoveryOwnerAlertEmail(owner.email, disputeUrl, RECOVERY_HOLD_HOURS))] : []),
    ...admins.map((a) => () => sendEmail(adminRecoveryRequestEmail(a.email, reviewUrl, settingsUrl))),
  ];
  for (const send of sends) await send().catch((err) => console.error("recovery email failed", err));
  return { contactEmail: row.contactEmail };
}

/** Whether a dispute link is still good (for the dispute page). */
export async function recoveryForDisputeToken(token: string | undefined) {
  const id = await readToken("recovery-dispute", token);
  if (!id) return null;
  const [row] = await db.select({ id: accountRecoveryRequest.id, status: accountRecoveryRequest.status }).from(accountRecoveryRequest).where(eq(accountRecoveryRequest.id, id));
  return row ?? null;
}

/** "This wasn't me", from the account's own inbox: the request closes at
 *  once and nothing changes. The requester gets the usual decline. */
export async function disputeRecovery(token: string) {
  const id = await consumeToken("recovery-dispute", token);
  if (!id) return null;
  const note = "We couldn't confirm this request, so nothing was changed."; // Copy approved by the owner, 2026-11-10.
  const [row] = await db
    .update(accountRecoveryRequest)
    .set({ status: "declined", disputedAt: new Date(), resolvedAt: new Date(), resolutionNote: note })
    .where(and(eq(accountRecoveryRequest.id, id), eq(accountRecoveryRequest.status, "open")))
    .returning();
  if (!row) return { alreadyClosed: true };
  await db.insert(auditLog).values({ actorId: null, action: "account.recovery_disputed", targetType: "account_recovery_request", targetId: id });
  await forgetIdDocument(id, row.idStorageKey);
  await sendEmail(recoveryDeclinedEmail(row.contactEmail, note)).catch((err) => console.error("recovery declined email failed", err));
  return { alreadyClosed: false };
}

export type RecoveryStatus = (typeof accountRecoveryRequest.$inferSelect)["status"];

export async function listRecoveryRequests(status: "open" | "closed") {
  await requireRole("admin", "/admin/recovery");
  await dbReady;
  const rows = await db
    .select({
      id: accountRecoveryRequest.id,
      fullName: accountRecoveryRequest.fullName,
      accountEmail: accountRecoveryRequest.accountEmail,
      claimedRole: accountRecoveryRequest.claimedRole,
      status: accountRecoveryRequest.status,
      hasId: accountRecoveryRequest.idStorageKey,
      matched: accountRecoveryRequest.userId,
      createdAt: accountRecoveryRequest.createdAt,
      resolvedAt: accountRecoveryRequest.resolvedAt,
    })
    .from(accountRecoveryRequest)
    // Open requests appear once their contact address is confirmed.
    .where(
      status === "open"
        ? and(eq(accountRecoveryRequest.status, "open"), isNotNull(accountRecoveryRequest.contactVerifiedAt))
        : ne(accountRecoveryRequest.status, "open"),
    )
    .orderBy(status === "open" ? asc(accountRecoveryRequest.createdAt) : desc(accountRecoveryRequest.createdAt))
    .limit(200);
  return rows.map((r) => ({ ...r, hasId: Boolean(r.hasId), matched: Boolean(r.matched) }));
}

export const countOpenRecoveryRequests = async () => {
  await requireRole("admin", "/admin/recovery");
  await dbReady;
  return (
    await db
      .select({ id: accountRecoveryRequest.id })
      .from(accountRecoveryRequest)
      .where(and(eq(accountRecoveryRequest.status, "open"), isNotNull(accountRecoveryRequest.contactVerifiedAt)))
  ).length;
};

/** One request, with what we know about the account it matched. */
export async function getRecoveryRequest(id: string) {
  await requireRole("admin", "/admin/recovery");
  await dbReady;
  const [request] = await db.select().from(accountRecoveryRequest).where(eq(accountRecoveryRequest.id, id));
  if (!request) return null;
  let account = null;
  if (request.userId) {
    const [u] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        twoFactorEnabled: user.twoFactorEnabled,
      })
      .from(user)
      .where(eq(user.id, request.userId));
    if (u) {
      const [profile] = await db
        .select({ id: providerProfile.id, firstName: providerProfile.firstName, lastName: providerProfile.lastName, status: providerProfile.status })
        .from(providerProfile)
        .where(eq(providerProfile.userId, u.id));
      const licenses = profile
        ? await db
            .select({ state: providerLicense.state, licenseNumber: providerLicense.licenseNumber })
            .from(providerLicense)
            .where(eq(providerLicense.profileId, profile.id))
        : [];
      // Used since the request? A sign-in after it suggests the owner still has access.
      const [since] = await db
        .select({ count: count(), last: max(sessionTable.createdAt) })
        .from(sessionTable)
        .where(and(eq(sessionTable.userId, u.id), gt(sessionTable.createdAt, request.createdAt)));
      account = { ...u, profile: profile ?? null, licenses, signInsSince: Number(since?.count ?? 0), lastSignInSince: since?.last ?? null };
    }
  }
  const resolver = request.resolvedById
    ? (await db.select({ name: user.name }).from(user).where(eq(user.id, request.resolvedById)))[0]?.name ?? null
    : null;
  return { request, account, resolver };
}

async function forgetIdDocument(id: string, storageKey: string | null) {
  if (storageKey) await deleteFile(storageKey).catch((err) => console.error("recovery ID delete failed", err));
  await db.update(accountRecoveryRequest).set({ idStorageKey: null, idFileName: null, idMimeType: null }).where(eq(accountRecoveryRequest.id, id));
}

/** A Better Auth password link (the same kind "Forgot your password?" sends),
 *  valid for a day so the person has time to read our reply. */
async function passwordLink(userId: string) {
  const ctx = await auth.$context;
  const token = generateRandomString(24);
  await ctx.internalAdapter.createVerificationValue({
    value: userId,
    identifier: `reset-password:${token}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return `${ctx.baseURL}/reset-password/${token}?callbackURL=${encodeURIComponent("/reset-password")}`;
}

export type ResolveResult = { ok: true } | { ok: false; error: string };

/** Approve: move the account to the contact address, sign it out everywhere,
 *  optionally clear the authenticator, and send a link to choose a password. */
export async function completeRecovery(id: string, actorId: string, turnOffTwoFactor: boolean): Promise<ResolveResult> {
  const found = await getRecoveryRequest(id);
  if (!found || found.request.status !== "open") return { ok: false, error: "This request is already closed." };
  const { request, account } = found;
  if (!account) return { ok: false, error: "No account uses that email, so there's nothing to move. Decline it with a note instead." };
  if (account.role === "admin") return { ok: false, error: "Admin accounts are recovered from Admin → Admins (Reset access)." };
  if (!request.contactVerifiedAt) return { ok: false, error: "The new address hasn't been confirmed yet." };
  const movableAt = recoveryMovableAt(request);
  if (movableAt && movableAt > new Date()) {
    return { ok: false, error: `The account's owner has until ${movableAt.toUTCString()} to object, so it can't be moved yet.` };
  }
  const check = await checkNewEmail(account.id, account.role, account.email, request.contactEmail);
  if (!check.ok) return { ok: false, error: check.error };

  // Claim the request first, so a second admin (or a dispute) can't act on it too.
  const [claimed] = await db
    .update(accountRecoveryRequest)
    .set({ status: "completed", resolvedById: actorId, resolvedAt: new Date() })
    .where(and(eq(accountRecoveryRequest.id, id), eq(accountRecoveryRequest.status, "open")))
    .returning({ id: accountRecoveryRequest.id });
  if (!claimed) return { ok: false, error: "This request is already closed." };
  try {
    await applyEmailChange(account.id, request.contactEmail, actorId, true);
  } catch (err) {
    console.error("recovery email change failed", err);
    await db.update(accountRecoveryRequest).set({ status: "open", resolvedById: null, resolvedAt: null }).where(eq(accountRecoveryRequest.id, id));
    return { ok: false, error: "We couldn't move the account. Nothing was changed; please try again." };
  }
  await db.transaction(async (tx) => {
    // Whoever had the old inbox may also have a session.
    await tx.delete(sessionTable).where(eq(sessionTable.userId, account.id));
    if (turnOffTwoFactor) {
      await tx.delete(twoFactor).where(eq(twoFactor.userId, account.id));
      await tx.update(user).set({ twoFactorEnabled: false }).where(eq(user.id, account.id));
    }
    await tx.insert(auditLog).values({
      actorId,
      action: "account.recovery_completed",
      targetType: "user",
      targetId: account.id,
      meta: { requestId: id, twoFactorCleared: turnOffTwoFactor },
    });
  });
  await forgetIdDocument(id, request.idStorageKey);
  await sendEmail(recoveryCompletedEmail(request.contactEmail, await passwordLink(account.id))).catch((err) =>
    console.error("recovery completed email failed", err),
  );
  return { ok: true };
}

/** Decline: nothing changes; the note goes to the contact address. */
export async function declineRecovery(id: string, actorId: string, note: string): Promise<ResolveResult> {
  await requireRole("admin", "/admin/recovery");
  // Claimed atomically: a second admin (or a dispute) can't close it twice.
  const [request] = await db
    .update(accountRecoveryRequest)
    .set({ status: "declined", resolvedById: actorId, resolvedAt: new Date(), resolutionNote: note })
    .where(and(eq(accountRecoveryRequest.id, id), eq(accountRecoveryRequest.status, "open")))
    .returning();
  if (!request) return { ok: false, error: "This request is already closed." };
  await db.transaction(async (tx) => {
    await tx.insert(auditLog).values({
      actorId,
      action: "account.recovery_declined",
      targetType: "account_recovery_request",
      targetId: id,
    });
  });
  await forgetIdDocument(id, request.idStorageKey);
  await sendEmail(recoveryDeclinedEmail(request.contactEmail, note)).catch((err) => console.error("recovery declined email failed", err));
  return { ok: true };
}
