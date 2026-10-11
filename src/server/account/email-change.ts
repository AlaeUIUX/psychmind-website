import "server-only";
import { createOTP } from "@better-auth/utils/otp";
import { symmetricDecrypt } from "better-auth/crypto";
import { and, eq, ne } from "drizzle-orm";
import Stripe from "stripe";
import { db, dbReady } from "@/db";
import { account, auditLog, twoFactor, user } from "@/db/schema";
import { stripeConfigured } from "@/lib/billing";
import { auth } from "@/server/auth";
import { isAdminEmail } from "@/server/auth/admin-emails";
import { sendEmail } from "@/server/email";
import { emailChangeConfirmEmail, emailChangedNoticeEmail, emailChangeStartEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { consumeToken, issueToken, readToken } from "./tokens";

// Changing the email on an account, in two proofs:
// 1. the current inbox (a link to it), or, when that inbox is gone, the
//    authenticator app (plus the password, if the account has one);
// 2. the new inbox (a link to it). Only then does the email change, and the
//    old address is told.
// Without either proof the person asks support (server/account/recovery.ts).

const LINK_TTL = 30 * 60;

export type NewEmailCheck = { ok: true } | { ok: false; error: string };

/** Whether `userId` may move to `email`. */
export async function checkNewEmail(userId: string, role: string, currentEmail: string, email: string): Promise<NewEmailCheck> {
  if (email === currentEmail.toLowerCase()) return { ok: false, error: "That's already your email." };
  // ADMIN_EMAILS decides who's an admin at every sign-in, so an admin can
  // only move to another listed address, and nobody else can take one.
  if (role === "admin" && !isAdminEmail(email)) {
    return { ok: false, error: "Admins can only use an address on the admin list. Ask whoever manages ADMIN_EMAILS to add it first." };
  }
  if (role !== "admin" && isAdminEmail(email)) return { ok: false, error: "This address can't be used. Choose another one." };
  await dbReady;
  const [taken] = await db.select({ id: user.id }).from(user).where(and(eq(user.email, email), ne(user.id, userId)));
  if (taken) return { ok: false, error: "Another PsychMind account already uses this address." };
  return { ok: true };
}

/** Proof 1, by email: a link to the current address. */
export async function sendStartLink(userId: string, email: string) {
  const token = await issueToken("email-change-start", userId, userId, LINK_TTL);
  await sendEmail(emailChangeStartEmail(email, await appUrl(`/change-email?token=${token}`)));
}

/** Proof 1, by authenticator: returns the same kind of token the email link
 *  carries, or why it failed. */
export async function startWithAuthenticator(userId: string, code: string, password: string | null): Promise<{ token: string } | { error: string }> {
  await dbReady;
  if (password !== null) {
    const [credential] = await db
      .select({ hash: account.password })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
    const ctx = await auth.$context;
    if (!credential?.hash || !(await ctx.password.verify({ hash: credential.hash, password }))) {
      return { error: "That password isn't right." };
    }
  }
  const [row] = await db.select({ secret: twoFactor.secret, verified: twoFactor.verified }).from(twoFactor).where(eq(twoFactor.userId, userId));
  if (!row || row.verified === false) return { error: "Two-step login isn't on for this account." };
  const ctx = await auth.$context;
  const secret = await symmetricDecrypt({ key: ctx.secretConfig, data: row.secret });
  if (!(await createOTP(secret, { period: 30, digits: 6 }).verify(code))) return { error: "That code didn't work. Check your app and try again." };
  return { token: await issueToken("email-change-start", userId, userId, LINK_TTL) };
}

/** The account a proof-1 token belongs to, if it's still valid. */
export const startTokenOwner = (token: string | undefined) => readToken("email-change-start", token);

/** Proof 2: spends the proof-1 token and sends a link to the new address. */
export async function sendConfirmLink(token: string, userId: string, newEmail: string) {
  if ((await consumeToken("email-change-start", token)) !== userId) return false;
  const confirm = await issueToken("email-change-confirm", userId, JSON.stringify({ userId, email: newEmail }), LINK_TTL);
  await sendEmail(emailChangeConfirmEmail(newEmail, await appUrl(`/change-email/confirm?token=${confirm}`)));
  await db.insert(auditLog).values({ actorId: userId, action: "account.email_change_requested", targetType: "user", targetId: userId });
  return true;
}

/** The pending change behind a proof-2 token, without using it up. */
export async function pendingChange(token: string | undefined) {
  const value = await readToken("email-change-confirm", token);
  if (!value) return null;
  try {
    return JSON.parse(value) as { userId: string; email: string };
  } catch {
    return null;
  }
}

/** Moves an account to a new address (after both proofs, or by support):
 *  marks it verified, tells the old address, and keeps Stripe in step. */
export async function applyEmailChange(userId: string, newEmail: string, actorId: string, bySupport = false) {
  await dbReady;
  const [before] = await db.select({ email: user.email, stripeCustomerId: user.stripeCustomerId }).from(user).where(eq(user.id, userId));
  if (!before) return false;
  await db.transaction(async (tx) => {
    await tx.update(user).set({ email: newEmail, emailVerified: true }).where(eq(user.id, userId));
    await tx.insert(auditLog).values({
      actorId,
      action: bySupport ? "account.email_changed_by_support" : "account.email_changed",
      targetType: "user",
      targetId: userId,
    });
  });
  await Promise.allSettled([
    sendEmail(emailChangedNoticeEmail(before.email, newEmail, await appUrl("/contact"), bySupport)),
    // Receipts and Stripe's own emails follow the account.
    before.stripeCustomerId && stripeConfigured()
      ? new Stripe(process.env.STRIPE_SECRET_KEY!).customers.update(before.stripeCustomerId, { email: newEmail })
      : null,
  ]).then((results) => results.forEach((r) => r.status === "rejected" && console.error("after email change", r.reason)));
  return true;
}

/** Proof 2 done: spends the token and changes the email. */
export async function confirmEmailChange(token: string) {
  const value = await consumeToken("email-change-confirm", token);
  if (!value) return { ok: false as const, error: "expired" as const };
  const { userId, email } = JSON.parse(value) as { userId: string; email: string };
  const [current] = await db.select({ role: user.role, email: user.email }).from(user).where(eq(user.id, userId));
  if (!current) return { ok: false as const, error: "expired" as const };
  // Someone may have taken the address since the link was sent.
  const check = await checkNewEmail(userId, current.role, current.email, email);
  if (!check.ok) return { ok: false as const, error: "taken" as const, message: check.error };
  await applyEmailChange(userId, email, userId);
  return { ok: true as const, email, role: current.role };
}
