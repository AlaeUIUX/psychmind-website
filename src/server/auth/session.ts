import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { dbReady } from "@/db";
import { auth } from "./index";

// The authoritative auth checks. proxy.ts only redirects visitors without a
// session cookie (cheap, optimistic); every page, action and route handler
// that touches private data calls one of these.

export type Role = "patient" | "provider" | "admin";

export const getSession = cache(async () => {
  // Read the request first: it marks the page as per-request, so Next never
  // tries to pre-render a signed-in page (and its database calls) at build time.
  const requestHeaders = new Headers(await headers());
  // After a server action renews the session (e.g. turning on two-step login),
  // Next re-renders in the same request; cookies() already has the new cookie
  // while the request's Cookie header still names the deleted session.
  requestHeaders.set("cookie", (await cookies()).toString());
  await dbReady;
  return auth.api.getSession({ headers: requestHeaders });
});

/** Where each role lands after logging in. */
export function homeFor(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "provider") return "/provider";
  return "/account";
}

async function requireSession(next?: string, login = "/login") {
  const session = await getSession();
  if (!session) redirect(`${login}${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return session;
}

/** Added by the two-factor plugin (not in the inferred session type). */
export function hasTwoFactor(user: object) {
  return (user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled === true;
}

/** An admin still on the temporary password they were emailed. */
export function mustChangePassword(user: object) {
  return (user as { mustChangePassword?: boolean | null }).mustChangePassword === true;
}

/** Signed in, email verified, and the right role — otherwise redirect. */
export async function requireRole(role: Role, next?: string) {
  // Admins have their own log-in page.
  const session = await requireSession(next, role === "admin" ? "/admin/login" : "/login");
  if (!session.user.emailVerified) redirect("/verify-email");
  if (session.user.role !== role) redirect(homeFor(session.user.role));
  // First log-in with a temporary password: replace it before anything else.
  if (role === "admin" && mustChangePassword(session.user)) redirect("/admin/password");
  // Admins can see every provider's documents: no admin page or action
  // works until two-step login is on.
  if (role === "admin" && !hasTwoFactor(session.user)) redirect("/two-factor/setup");
  return session;
}
