import "server-only";
import { headers } from "next/headers";
import { appHost } from "@/lib/hosts";

/** Absolute URL for links in emails and Stripe redirects. Uses BETTER_AUTH_URL
 *  when set (production); otherwise the host of the current request, so local
 *  dev works on any port. */
export async function appUrl(path = "/") {
  let base =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development" ? `http://${appHost() ?? "localhost"}:${process.env.PORT ?? 3000}` : undefined);
  if (!base) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
    base = host ? `${proto}://${host}` : "http://localhost:3000";
  }
  return new URL(path, base).toString();
}
