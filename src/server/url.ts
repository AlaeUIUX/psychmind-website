import "server-only";
import { headers } from "next/headers";
import { adminHostPath, adminOrigin, defaultOrigin, isAdminPath } from "@/lib/hosts";
import { isAdminEmail } from "@/server/auth/admin-emails";

/** Absolute URL for links in emails and Stripe redirects. Uses BETTER_AUTH_URL
 *  when set (production); otherwise the host of the current request, so local
 *  dev works on any port. Admin pages are on the admin host when there is one
 *  (lib/hosts.ts), the log-in as its /login. */
export async function appUrl(path = "/") {
  const admin = adminOrigin();
  if (admin && isAdminPath(path.split(/[?#]/)[0])) return new URL(adminHostPath(path), admin).toString();
  let base = process.env.BETTER_AUTH_URL || defaultOrigin();
  if (!base) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
    base = host ? `${proto}://${host}` : "http://localhost:3001";
  }
  return new URL(path, base).toString();
}

/** A link in an email about someone's own account (change email, reset,
 *  "your password changed"). A team member's goes to the admin host, the
 *  only place they can sign in; everyone else's to the main site. */
export async function accountUrl(path: string, email: string) {
  const admin = adminOrigin();
  if (admin && isAdminEmail(email)) return new URL(path, admin).toString();
  return appUrl(path);
}

/** The same link moved to the admin host for a team member (Better Auth
 *  builds reset links on BETTER_AUTH_URL; /api is served on both hosts). */
export function onAccountHost(url: string, email: string) {
  const admin = adminOrigin();
  if (!admin || !isAdminEmail(email)) return url;
  const moved = new URL(url);
  const target = new URL(admin);
  moved.protocol = target.protocol;
  moved.host = target.host;
  return moved.toString();
}
