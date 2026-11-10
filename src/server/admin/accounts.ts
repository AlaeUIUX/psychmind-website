import "server-only";
import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { account, auditLog, session, twoFactor, user } from "@/db/schema";
import { temporaryPassword } from "@/lib/admin/temporary-password";
import { listedAdminEmails } from "@/server/auth/admin-emails";
import { sendEmail } from "@/server/email";
import { adminAccessEmail } from "@/server/emails";
import { appUrl } from "@/server/url";

// Admin accounts are made for people, never signed up for (owner request,
// 2026-10-08). Every address in ADMIN_EMAILS gets an account with a
// temporary password, sent by email. The first log-in must replace it and
// set up an authenticator app before anything else (requireRole), and the
// temporary password stops working after a few days (the sign-in hook in
// server/auth). Another admin can reset someone's access the same way.

export const TEMP_PASSWORD_DAYS = 3;

/** "acherkaoui@…" → "Acherkaoui", until they give their name at first log-in. */
const nameFromEmail = (email: string) => {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "Admin";
};

const expiry = () => new Date(Date.now() + TEMP_PASSWORD_DAYS * 86_400_000);

async function emailAccess(to: string, temp: string, expiresAt: Date, kind: "new" | "reset") {
  await sendEmail(adminAccessEmail(to, temp, expiresAt, await appUrl("/admin/login"), kind));
}

let checkedAt = 0;

/** Creates an account for every listed admin who doesn't have one yet and
 *  emails them a temporary password. Cheap to call often (one query, at
 *  most once a minute per server); creating is race-safe. */
export async function ensureAdminAccounts({ force = false } = {}) {
  const emails = listedAdminEmails();
  if (!emails.length || (!force && Date.now() - checkedAt < 60_000)) return 0;
  checkedAt = Date.now();
  await dbReady;
  const existing = new Set((await db.select({ email: user.email }).from(user).where(inArray(user.email, emails))).map((u) => u.email));
  let created = 0;
  for (const email of emails) {
    if (existing.has(email)) continue;
    const temp = temporaryPassword();
    const id = crypto.randomUUID();
    const expiresAt = expiry();
    const hash = await hashPassword(temp);
    const made = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(user)
        .values({ id, name: nameFromEmail(email), email, emailVerified: true, role: "admin", mustChangePassword: true, tempPasswordExpiresAt: expiresAt })
        // Another server made it a moment ago: they send the email.
        .onConflictDoNothing({ target: user.email })
        .returning({ id: user.id });
      if (!row) return false;
      await tx.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
      await tx.insert(auditLog).values({ actorId: null, action: "admin.created", targetType: "user", targetId: id, meta: {} });
      return true;
    });
    if (!made) continue;
    created++;
    await emailAccess(email, temp, expiresAt, "new").catch((err) => console.error("admin access email failed", err));
  }
  return created;
}

/** A listed address whose account existed before it was listed (or that
 *  someone registered for it). It becomes an admin only the way new admins
 *  do: a temporary password sent to the address, two-step login set up from
 *  scratch, every existing session ended. Its old password stops working. */
export async function promoteListedAccount(userId: string) {
  await dbReady;
  const [target] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, userId));
  if (!target || !listedAdminEmails().includes(target.email)) return false;
  const temp = temporaryPassword();
  const expiresAt = expiry();
  const hash = await hashPassword(temp);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(account)
      .set({ password: hash })
      .where(and(eq(account.userId, target.id), eq(account.providerId, "credential")))
      .returning({ id: account.id });
    if (!updated.length) {
      await tx.insert(account).values({ id: crypto.randomUUID(), accountId: target.id, providerId: "credential", userId: target.id, password: hash });
    }
    // Any Google link goes too: admins sign in with email, password and code.
    await tx.delete(account).where(and(eq(account.userId, target.id), ne(account.providerId, "credential")));
    await tx
      .update(user)
      .set({ role: "admin", emailVerified: true, mustChangePassword: true, tempPasswordExpiresAt: expiresAt, twoFactorEnabled: false })
      .where(eq(user.id, target.id));
    await tx.delete(twoFactor).where(eq(twoFactor.userId, target.id));
    await tx.delete(session).where(eq(session.userId, target.id));
    await tx.insert(auditLog).values({ actorId: null, action: "admin.promoted", targetType: "user", targetId: target.id, meta: {} });
  });
  await emailAccess(target.email, temp, expiresAt, "new").catch((err) => console.error("admin access email failed", err));
  return true;
}

/** An admin taken off ADMIN_EMAILS: no longer an admin, and signed out
 *  everywhere, at once (requireRole calls this on their next request). */
export async function revokeRemovedAdmin(userId: string) {
  await dbReady;
  await db.transaction(async (tx) => {
    await tx.update(user).set({ role: "patient" }).where(and(eq(user.id, userId), eq(user.role, "admin")));
    await tx.delete(session).where(eq(session.userId, userId));
    await tx.insert(auditLog).values({ actorId: null, action: "admin.removed", targetType: "user", targetId: userId, meta: {} });
  });
}

/** A fresh temporary password for another admin who's locked out (lost
 *  password or authenticator). Their authenticator and sessions are reset
 *  too, so they set both up again at their next log-in. */
export async function resetAdminAccess(targetId: string, actorId: string) {
  await dbReady;
  const [target] = await db.select({ id: user.id, email: user.email, role: user.role }).from(user).where(eq(user.id, targetId));
  if (!target || target.role !== "admin" || target.id === actorId || !listedAdminEmails().includes(target.email)) return false;
  const temp = temporaryPassword();
  const expiresAt = expiry();
  const hash = await hashPassword(temp);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(account)
      .set({ password: hash })
      .where(and(eq(account.userId, target.id), eq(account.providerId, "credential")))
      .returning({ id: account.id });
    if (!updated.length) {
      await tx.insert(account).values({ id: crypto.randomUUID(), accountId: target.id, providerId: "credential", userId: target.id, password: hash });
    }
    await tx.update(user).set({ mustChangePassword: true, tempPasswordExpiresAt: expiresAt, twoFactorEnabled: false }).where(eq(user.id, target.id));
    await tx.delete(twoFactor).where(eq(twoFactor.userId, target.id));
    await tx.delete(session).where(eq(session.userId, target.id));
    await tx.insert(auditLog).values({ actorId, action: "admin.access_reset", targetType: "user", targetId: target.id, meta: {} });
  });
  await emailAccess(target.email, temp, expiresAt, "reset");
  return true;
}
