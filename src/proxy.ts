import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";
import {
  adminHost,
  adminHostPath,
  appHost,
  isAdminHostPath,
  isAdminPath,
  isAppPath,
  isProtectedPath,
  isSharedPath,
  loginPathFor,
  marketingHost,
} from "@/lib/hosts";

// 1. Host routing (see lib/hosts.ts): portal pages live on the app host,
//    marketing pages on www. Each redirects to the other, keeping the path. The
//    admin console lives on the admin host, when there is one, with /login as its
//    front door.
// 2. Optimistic gate for signed-in areas: no session cookie → log in (keeping
//    where they were going). Real checks — valid session, verified email,
//    role — happen in the pages and actions (src/server/auth/session.ts).
// 3. Content-Security-Policy on every page (lib/csp.ts).
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;
  // A deployment without its database and session secret (e.g. production
  // before they're added in Vercel) can't serve accounts: those pages would
  // only error, so they're "not found" until both are set.
  const appConfigured = !process.env.VERCEL || Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
  if (!appConfigured) {
    if (/^\/api\/(auth|uploads|files|account|account-recovery|admin|zip)(\/|$)/.test(path)) return NextResponse.json({ error: "Not available." }, { status: 404 });
    if (isAppPath(path)) return NextResponse.rewrite(new URL("/_app-not-configured", request.url));
  }

  const app = appHost();
  // nextUrl.hostname can be the server's own name in dev; trust the Host header.
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host).split(":")[0];

  // Vercel previews: sign-in only works on the branch's stable URL (the one
  // registered with Google), so portal pages move there from per-deploy URLs.
  const branchHost = process.env.VERCEL_ENV === "preview" && !process.env.BETTER_AUTH_URL ? process.env.VERCEL_BRANCH_URL : undefined;
  if (branchHost && isAppPath(path) && host !== branchHost) return redirectToHost(request, branchHost);

  const admin = adminHost();
  if (admin && !isSharedPath(path)) {
    if (host === admin) return adminPortal(request, path);
    if (isAdminPath(path)) return redirectToHost(request, admin, adminHostPath(path));
  }

  if (app && !isSharedPath(path)) {
    const onApp = host === app;
    if (onApp && path === "/") {
      const hasSession = Boolean(getSessionCookie(request, { cookiePrefix: "psychmind" }));
      return NextResponse.redirect(new URL(hasSession ? "/auth/continue" : "/login", request.url));
    }
    // (Locally the marketing host is the dev server's own "localhost", which
    // Next turns into a relative redirect — so dev just serves it on app.localhost.)
    const marketing = marketingHost(app);
    if (onApp && !isAppPath(path) && marketing !== "localhost") return redirectToHost(request, marketing);
    if (!onApp && isAppPath(path)) return redirectToHost(request, app);
  }

  if (isProtectedPath(path) && !getSessionCookie(request, { cookiePrefix: "psychmind" })) {
    const login = new URL(loginPathFor(path), request.url);
    login.searchParams.set("next", path + url.search);
    return NextResponse.redirect(login);
  }
  return withContentSecurityPolicy(request, path);
}

/** The admin host: "/" opens the console (or its log-in), "/login" is the log-in page,
 *  and anything that isn't the console or an admin's sign-in steps moves to the main site. */
function adminPortal(request: NextRequest, path: string) {
  const url = request.nextUrl;
  const signedIn = Boolean(getSessionCookie(request, { cookiePrefix: "psychmind" }));
  if (path === "/") return NextResponse.redirect(new URL(signedIn ? "/admin" : "/login", request.url));
  if (path === "/admin/login") return NextResponse.redirect(new URL(`/login${url.search}`, request.url));
  if (path === "/login") return withContentSecurityPolicy(request, "/admin/login", new URL(`/admin/login${url.search}`, request.url));
  if (!isAdminHostPath(path)) {
    const main = mainHost(path);
    // (locally the main site is the dev server's own "localhost": served here instead)
    if (main && main !== "localhost") return redirectToHost(request, main);
  }
  if (isProtectedPath(path) && !signedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path + url.search);
    return NextResponse.redirect(login);
  }
  return withContentSecurityPolicy(request, path);
}

/** Where a path that isn't the admin host's belongs: the app host for portal pages
 *  (when there is one), otherwise the main site (BETTER_AUTH_URL's host). */
function mainHost(path: string): string | null {
  const app = appHost();
  if (app) return isAppPath(path) ? app : marketingHost(app);
  try {
    return process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).hostname : null;
  } catch {
    return null;
  }
}

/** `rewriteTo`: serve this page instead (the admin host's /login is /admin/login). */
function withContentSecurityPolicy(request: NextRequest, path: string, rewriteTo?: URL) {
  // Decap CMS is its own static app; API responses aren't pages (and a CSP
  // would get in the way of the browser's PDF viewer for license documents).
  if (/^\/(cms|api)(\/|$)/.test(path)) return NextResponse.next();
  // Portal pages render per request, so Next can tag its scripts with a
  // nonce; it reads the nonce from this request header.
  const nonce = isAppPath(path) ? btoa(crypto.randomUUID()) : null;
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  if (nonce) requestHeaders.set("Content-Security-Policy", csp);
  const response = rewriteTo
    ? NextResponse.rewrite(rewriteTo, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function redirectToHost(request: NextRequest, hostname: string, pathname?: string) {
  const target = new URL(request.url);
  target.hostname = hostname;
  if (pathname) target.pathname = pathname;
  return NextResponse.redirect(target, 307);
}

export const config = {
  // Everything except static files and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml|woff2?|ttf|css|js|map|yml)$).*)"],
};
