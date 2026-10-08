"use server";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, dbReady } from "@/db";
import { user } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { auth } from "./index";
import { setPendingEmail } from "./pending-email";
import { homeFor } from "./session";

// Email/password auth as server actions. Roles are assigned here, server-side,
// never from client input. Messages are new microcopy — TODO(client).

export type AuthState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");
const password = z.string().min(8, "Must be at least 8 characters long.").max(128, "That password is too long.");

const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(60),
    lastName: z.string().trim().min(1, "Last name is required.").max(60),
    email,
    password,
    businessName: z.string().trim().max(100).optional(),
    displayAsBusiness: z.enum(["on"]).optional(),
  });

function issues(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

/** Only allow same-site relative redirects (no open redirects via ?next=). */
function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

/** Better Auth only rate-limits browser requests, not server calls like these. */
async function limited(name: string, key: string, max: number, window: `${number} ${"m" | "h"}`) {
  const ip = clientIp(await headers());
  const [byIp, byKey] = await Promise.all([
    rateLimit(`auth-${name}-ip`, ip, max * 4, window),
    rateLimit(`auth-${name}`, `${ip}:${key}`, max, window),
  ]);
  return !byIp.ok || !byKey.ok;
}

function authMessage(err: unknown) {
  if (err instanceof APIError) {
    const code = (err.body as { code?: string } | undefined)?.code;
    if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
      return "An account with this email already exists. Try logging in instead.";
    if (code === "INVALID_EMAIL_OR_PASSWORD") return "That email and password don't match. Please try again.";
    if (code === "EMAIL_NOT_VERIFIED") return "EMAIL_NOT_VERIFIED";
    if (code === "PASSWORD_TOO_SHORT") return "Must be at least 8 characters long.";
    if (err.status === "TOO_MANY_REQUESTS") return "Too many attempts. Please wait a few minutes and try again.";
    if (code === "INVALID_TOKEN") return "This link has expired or was already used. Request a new one.";
  }
  console.error("auth action failed", err);
  return "Something went wrong. Please try again.";
}

async function signUp(role: "patient" | "provider", form: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = signUpSchema.safeParse(raw);
  const values = { firstName: raw.firstName ?? "", lastName: raw.lastName ?? "", email: raw.email ?? "", businessName: raw.businessName ?? "" };
  if (!parsed.success) return { fieldErrors: issues(parsed.error), values };

  const v = parsed.data;
  if (await limited("signup", v.email, 5, "10 m")) return { error: TOO_MANY, values };
  await dbReady;
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: `${v.firstName} ${v.lastName}`,
        email: v.email,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        callbackURL: role === "provider" ? "/provider/onboarding" : "/account",
      },
      headers: await headers(),
    });
    // An existing email gets a synthetic success (no account enumeration):
    // only touch rows that really exist.
    const [created] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, result.user.id));
    if (role === "provider" && created && created.role !== "admin") {
      await db.update(user).set({ role: "provider" }).where(eq(user.id, created.id));
      if (v.businessName) {
        // The profile row is created on first visit; remember the business name now.
        const { ensureProfile } = await import("@/server/provider/data");
        const { providerProfile } = await import("@/db/schema");
        const profile = await ensureProfile(result.user.id);
        await db
          .update(providerProfile)
          .set({ businessName: v.businessName, displayAsBusiness: v.displayAsBusiness === "on" })
          .where(eq(providerProfile.id, profile.id));
      }
    }
  } catch (err) {
    return { error: authMessage(err), values };
  }
  await setPendingEmail(v.email);
  redirect("/verify-email");
}

export async function signUpPatient(_prev: AuthState, form: FormData) {
  return signUp("patient", form);
}

export async function signUpProvider(_prev: AuthState, form: FormData) {
  return signUp("provider", form);
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password.") }).safeParse(Object.fromEntries(form));
  const values = { email: String(form.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: issues(parsed.error), values };
  if (await limited("signin", parsed.data.email, 5, "1 m")) return { error: TOO_MANY, values };
  await dbReady;
  let role: string | undefined;
  try {
    const result = await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password, rememberMe: true },
      headers: await headers(),
    });
    role = (result.user as { role?: string }).role;
  } catch (err) {
    const message = authMessage(err);
    if (message === "EMAIL_NOT_VERIFIED") {
      await setPendingEmail(parsed.data.email);
      redirect("/verify-email");
    }
    return { error: message, values };
  }
  redirect(safeNext(form.get("next")) ?? homeFor(role));
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: issues(parsed.error), values: { email: String(form.get("email") ?? "") } };
  if (await limited("reset", parsed.data.email, 3, "10 m")) return { error: TOO_MANY, values: { email: parsed.data.email } };
  await dbReady;
  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch (err) {
    // Don't reveal whether the email exists; only surface rate limiting.
    const message = authMessage(err);
    if (message.startsWith("Too many")) return { error: message, values: { email: parsed.data.email } };
  }
  await setPendingEmail(parsed.data.email);
  redirect("/forgot-password/sent");
}

export async function resetPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({ token: z.string().min(1, "This link is invalid."), password })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: issues(parsed.error) };
  if (await limited("reset-confirm", "token", 10, "10 m")) return { error: TOO_MANY };
  await dbReady;
  try {
    await auth.api.resetPassword({ body: { newPassword: parsed.data.password, token: parsed.data.token }, headers: await headers() });
  } catch (err) {
    return { error: authMessage(err) };
  }
  redirect("/login?reset=1");
}

export async function resendVerification(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: issues(parsed.error) };
  if (await limited("verify", parsed.data.email, 3, "10 m")) return { error: TOO_MANY };
  await dbReady;
  try {
    await auth.api.sendVerificationEmail({ body: { email: parsed.data.email, callbackURL: "/auth/continue" }, headers: await headers() });
  } catch (err) {
    const message = authMessage(err);
    if (message.startsWith("Too many")) return { error: message };
  }
  return { values: { sent: "1" } };
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
