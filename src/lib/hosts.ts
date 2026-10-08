// Two front doors, one Next.js app:
// - the marketing site (www.psychmind.org), and
// - the product portal (app.psychmind.org): sign-up, log in, onboarding,
//   dashboards, admin.
// proxy.ts sends each request to the right host. APP_HOST turns the split
// on (production: "app.psychmind.org"; locally it defaults to "app.localhost",
// which browsers resolve to this machine). Without it — e.g. Vercel preview
// URLs — everything is served from one host.

/** Path prefixes that belong to the portal. */
export const APP_PREFIXES = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/provider",
  "/account",
  "/admin",
] as const;

/** Served on both hosts. */
export const SHARED_PREFIXES = ["/api", "/dev", "/_next", "/images", "/fonts", "/cms"] as const;

/** Signed-in areas: no session cookie → log in. */
export const PROTECTED_PREFIXES = ["/provider", "/account", "/admin"] as const;

const matches = (path: string, prefixes: readonly string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

export const isAppPath = (path: string) => matches(path, APP_PREFIXES);
export const isSharedPath = (path: string) => matches(path, SHARED_PREFIXES) || /\.[a-z0-9]+$/i.test(path);
export const isProtectedPath = (path: string) => matches(path, PROTECTED_PREFIXES);

export function appHost(): string | null {
  // "off" serves everything from one host — e.g. to test Google sign-in
  // locally, since Google only accepts http://localhost (not app.localhost).
  if (process.env.APP_HOST === "off") return null;
  if (process.env.APP_HOST) return process.env.APP_HOST;
  return process.env.NODE_ENV === "development" ? "app.localhost" : null;
}

/** The public origin when BETTER_AUTH_URL isn't set: the dev server locally,
 *  and on Vercel previews the branch's stable URL
 *  (<project>-git-<branch>-<team>.vercel.app), so Google sign-in has one
 *  fixed redirect URI per branch. */
export function defaultOrigin(): string | undefined {
  if (process.env.NODE_ENV === "development") return `http://${appHost() ?? "localhost"}:${process.env.PORT ?? 3000}`;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`;
  return undefined;
}

/** The marketing host for a given app host (app.psychmind.org → www.psychmind.org). */
export function marketingHost(app: string): string {
  if (process.env.MARKETING_HOST) return process.env.MARKETING_HOST;
  const bare = app.replace(/^app\./, "");
  return bare === "localhost" ? bare : `www.${bare}`;
}
