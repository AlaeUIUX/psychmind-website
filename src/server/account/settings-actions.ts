"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { auth } from "@/server/auth";
import { getSession, hasTwoFactor } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import { passwordChangedEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { hasPasswordLogin } from "./data";
import { checkNewEmail, confirmEmailChange, sendConfirmLink, sendStartLink, startTokenOwner, startWithAuthenticator } from "./email-change";

// Settings → Login: change your email (two proofs, see email-change.ts) and
// change or set your password. Shared by patients, providers and admins.
// TODO(client): copy.

export type SettingsState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; sentTo?: string } | null;

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

async function signedIn() {
  const session = await getSession();
  if (!session?.user.emailVerified) redirect("/login");
  return session;
}

/** Proof 1 by email: "Send verification link" in the Change email dialog. */
export async function startEmailChange(): Promise<SettingsState> {
  const { user } = await signedIn();
  if (!(await rateLimit("email-change-start", user.id, 3, "10 m")).ok) return { error: TOO_MANY };
  try {
    await sendStartLink(user.id, user.email);
  } catch (err) {
    console.error("email change link failed", err);
    return { error: "We couldn't send the email. Please try again in a moment." };
  }
  return { ok: true, sentTo: user.email };
}

/** Proof 1 when the old inbox is gone: the authenticator app (and password). */
export async function startEmailChangeWithCode(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await signedIn();
  if (!hasTwoFactor(user)) return { error: "Two-step login isn't on for this account." };
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { fieldErrors: { code: "Enter the 6-digit code from your app." } };
  const needsPassword = await hasPasswordLogin(user.id);
  const password = needsPassword ? String(form.get("password") ?? "") : null;
  if (needsPassword && !password) return { fieldErrors: { password: "Enter your password." } };
  // Codes are only 6 digits: few tries per account, whatever the IP.
  if (!(await rateLimit("email-change-code", user.id, 5, "10 m")).ok) return { error: TOO_MANY };
  const result = await startWithAuthenticator(user.id, code, password);
  if ("error" in result) return { error: result.error };
  redirect(`/change-email?token=${result.token}`);
}

/** Proof 2: the new address, from the page the proof-1 link opens. */
export async function chooseNewEmail(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await signedIn();
  const token = String(form.get("token") ?? "");
  if ((await startTokenOwner(token)) !== user.id) return { error: "This link has expired. Start again from Settings." };
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };
  if (!(await rateLimit("email-change-new", user.id, 5, "10 m")).ok) return { error: TOO_MANY };
  const check = await checkNewEmail(user.id, user.role ?? "patient", user.email, parsed.data);
  if (!check.ok) return { fieldErrors: { email: check.error } };
  try {
    if (!(await sendConfirmLink(token, user.id, parsed.data))) return { error: "This link has expired. Start again from Settings." };
  } catch (err) {
    console.error("email change confirm link failed", err);
    return { error: "We couldn't send the email. Please try again in a moment." };
  }
  return { ok: true, sentTo: parsed.data };
}

export type ConfirmEmailState = { ok?: boolean; email?: string; home?: string; error?: string } | null;

/** Proof 2 done: the button on the page the new address's link opens. A
 *  button, not the link itself, so mail scanners that open links can't
 *  spend it. Works signed out: the link alone proves the new inbox. */
export async function confirmNewEmail(_prev: ConfirmEmailState, form: FormData): Promise<ConfirmEmailState> {
  const ip = clientIp(await headers());
  if (!(await rateLimit("email-change-confirm", ip, 20, "10 m")).ok) return { error: TOO_MANY };
  const result = await confirmEmailChange(String(form.get("token") ?? ""));
  if (!result.ok) return { error: result.error === "taken" ? result.message : "This link has expired or was already used. Start again from Settings." };
  const home = result.role === "admin" ? "/admin/settings" : result.role === "provider" ? "/provider/settings" : "/account/settings";
  return { ok: true, email: result.email, home };
}

const passwordFor = (role: string) =>
  role === "admin"
    ? z.string().min(12, "Use at least 12 characters.").max(128, "That password is too long.")
    : z.string().min(8, "Must be at least 8 characters long.").max(128, "That password is too long.");

/** Change password: the current one, then the new one. Logs out every other device. */
export async function changePassword(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await signedIn();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const parsed = passwordFor(user.role ?? "patient").safeParse(String(form.get("newPassword") ?? ""));
  const fieldErrors: Record<string, string> = {};
  if (!currentPassword) fieldErrors.currentPassword = "Enter your current password.";
  if (!parsed.success) fieldErrors.newPassword = parsed.error.issues[0].message;
  else if (parsed.data === currentPassword) fieldErrors.newPassword = "Choose a password you're not using now.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  if (!(await rateLimit("password-change", user.id, 5, "10 m")).ok) return { error: TOO_MANY };

  try {
    await auth.api.changePassword({ body: { currentPassword, newPassword: parsed.data!, revokeOtherSessions: true }, headers: await headers() });
  } catch (err) {
    const code = err instanceof APIError ? (err.body as { code?: string } | undefined)?.code : undefined;
    if (code === "INVALID_PASSWORD") return { fieldErrors: { currentPassword: "That password isn't right." } };
    console.error("password change failed", err);
    return { error: "We couldn't change your password. Please try again." };
  }
  await db.insert(auditLog).values({ actorId: user.id, action: "account.password_changed", targetType: "user", targetId: user.id });
  await sendEmail(passwordChangedEmail(user.email, await appUrl("/forgot-password"))).catch((err) => console.error("password changed email failed", err));
  return { ok: true };
}

/** Accounts made with Google have no password: add one. Needs a recent log-in. */
export async function setPassword(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await signedIn();
  if (await hasPasswordLogin(user.id)) return { error: "This account already has a password." };
  const parsed = passwordFor(user.role ?? "patient").safeParse(String(form.get("newPassword") ?? ""));
  if (!parsed.success) return { fieldErrors: { newPassword: parsed.error.issues[0].message } };
  if (!(await rateLimit("password-set", user.id, 5, "10 m")).ok) return { error: TOO_MANY };
  try {
    await auth.api.setPassword({ body: { newPassword: parsed.data }, headers: await headers() });
  } catch (err) {
    const code = err instanceof APIError ? (err.body as { code?: string } | undefined)?.code : undefined;
    if (code === "SESSION_EXPIRED") return { error: "For your security, log out and back in, then add a password." };
    console.error("set password failed", err);
    return { error: "We couldn't add a password. Please try again." };
  }
  await db.insert(auditLog).values({ actorId: user.id, action: "account.password_set", targetType: "user", targetId: user.id });
  return { ok: true };
}
