import "server-only";
import { generateRandomString } from "better-auth/crypto";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { accountRecoveryRequest, auditLog, providerLicense, providerProfile, session as sessionTable, twoFactor, user } from "@/db/schema";
import { auth } from "@/server/auth";
import { requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import {
  adminRecoveryRequestEmail,
  recoveryCompletedEmail,
  recoveryDeclinedEmail,
  recoveryOwnerAlertEmail,
  recoveryReceivedEmail,
} from "@/server/emails";
import { deleteFile } from "@/server/storage";
import { appUrl } from "@/server/url";
import { applyEmailChange, checkNewEmail } from "./email-change";

// Account recovery, for when someone can't get into their email anymore (a
// closed work address, a hacked inbox) and has no authenticator to prove it's
// them. A person on the team checks who they are, then moves the account to
// the new address and sends a link to choose a password. Providers send a
// photo ID (we have their license on file to compare); patients can too.
// The requester is never told whether an account matched.

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

  const admins = await db.select({ email: user.email }).from(user).where(eq(user.role, "admin"));
  const [reviewUrl, helpUrl] = await Promise.all([appUrl(`/admin/recovery/${row.id}`), appUrl("/contact")]);
  const results = await Promise.allSettled([
    sendEmail(recoveryReceivedEmail(input.contactEmail)),
    owner ? sendEmail(recoveryOwnerAlertEmail(owner.email, helpUrl)) : null,
    ...admins.map((a) => sendEmail(adminRecoveryRequestEmail(a.email, reviewUrl))),
  ]);
  results.forEach((r) => r.status === "rejected" && console.error("recovery email failed", r.reason));
  return row.id;
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
    .where(status === "open" ? eq(accountRecoveryRequest.status, "open") : ne(accountRecoveryRequest.status, "open"))
    .orderBy(status === "open" ? asc(accountRecoveryRequest.createdAt) : desc(accountRecoveryRequest.createdAt))
    .limit(200);
  return rows.map((r) => ({ ...r, hasId: Boolean(r.hasId), matched: Boolean(r.matched) }));
}

export const countOpenRecoveryRequests = async () => {
  await requireRole("admin", "/admin/recovery");
  await dbReady;
  return (await db.select({ id: accountRecoveryRequest.id }).from(accountRecoveryRequest).where(eq(accountRecoveryRequest.status, "open"))).length;
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
      account = { ...u, profile: profile ?? null, licenses };
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
  const check = await checkNewEmail(account.id, account.role, account.email, request.contactEmail);
  if (!check.ok) return { ok: false, error: check.error };

  await applyEmailChange(account.id, request.contactEmail, actorId, true);
  await db.transaction(async (tx) => {
    // Whoever had the old inbox may also have a session.
    await tx.delete(sessionTable).where(eq(sessionTable.userId, account.id));
    if (turnOffTwoFactor) {
      await tx.delete(twoFactor).where(eq(twoFactor.userId, account.id));
      await tx.update(user).set({ twoFactorEnabled: false }).where(eq(user.id, account.id));
    }
    await tx
      .update(accountRecoveryRequest)
      .set({ status: "completed", resolvedById: actorId, resolvedAt: new Date() })
      .where(and(eq(accountRecoveryRequest.id, id), eq(accountRecoveryRequest.status, "open")));
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
  await dbReady;
  const [request] = await db.select().from(accountRecoveryRequest).where(eq(accountRecoveryRequest.id, id));
  if (!request || request.status !== "open") return { ok: false, error: "This request is already closed." };
  await db.transaction(async (tx) => {
    await tx
      .update(accountRecoveryRequest)
      .set({ status: "declined", resolvedById: actorId, resolvedAt: new Date(), resolutionNote: note })
      .where(eq(accountRecoveryRequest.id, id));
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
