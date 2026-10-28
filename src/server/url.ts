import "server-only";
import { headers } from "next/headers";
import { adminHostPath, adminOrigin, defaultOrigin, isAdminPath } from "@/lib/hosts";

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
    base = host ? `${proto}://${host}` : "http://localhost:3000";
  }
  return new URL(path, base).toString();
}
