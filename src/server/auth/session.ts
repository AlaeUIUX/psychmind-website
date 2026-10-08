import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { dbReady } from "@/db";
import { auth } from "./index";

// The authoritative auth checks. proxy.ts only redirects visitors without a
// session cookie (cheap, optimistic); every page, action and route handler
// that touches private data calls one of these.

export type Role = "patient" | "provider" | "admin";

export const getSession = cache(async () => {
  await dbReady;
  return auth.api.getSession({ headers: await headers() });
});

/** Where each role lands after logging in. */
export function homeFor(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "provider") return "/provider";
  return "/account";
}

export async function requireSession(next?: string) {
  const session = await getSession();
  if (!session) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return session;
}

/** Signed in, email verified, and the right role — otherwise redirect. */
export async function requireRole(role: Role, next?: string) {
  const session = await requireSession(next);
  if (!session.user.emailVerified) redirect("/verify-email");
  if (session.user.role !== role) redirect(homeFor(session.user.role));
  return session;
}
