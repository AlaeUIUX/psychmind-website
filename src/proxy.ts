import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";
import { appHost, isAppPath, isProtectedPath, isSharedPath, loginPathFor, marketingHost } from "@/lib/hosts";

// 1. Host routing (see lib/hosts.ts): portal pages live on the app host,
//    marketing pages on www. Each redirects to the other, keeping the path.
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
    if (/^\/api\/(auth|uploads|files|account)(\/|$)/.test(path)) return NextResponse.json({ error: "Not available." }, { status: 404 });
    if (isAppPath(path)) return NextResponse.rewrite(new URL("/_app-not-configured", request.url));
  }

  const app = appHost();
  // nextUrl.hostname can be the server's own name in dev; trust the Host header.
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host).split(":")[0];

  // Vercel previews: sign-in only works on the branch's stable URL (the one
  // registered with Google), so portal pages move there from per-deploy URLs.
  const branchHost = process.env.VERCEL_ENV === "preview" && !process.env.BETTER_AUTH_URL ? process.env.VERCEL_BRANCH_URL : undefined;
  if (branchHost && isAppPath(path) && host !== branchHost) return redirectToHost(request, branchHost);

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

function withContentSecurityPolicy(request: NextRequest, path: string) {
  // Decap CMS is its own static app; API responses aren't pages (and a CSP
  // would get in the way of the browser's PDF viewer for license documents).
  if (/^\/(cms|api)(\/|$)/.test(path)) return NextResponse.next();
  // Portal pages render per request, so Next can tag its scripts with a
  // nonce; it reads the nonce from this request header.
  const nonce = isAppPath(path) ? btoa(crypto.randomUUID()) : null;
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  if (nonce) requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function redirectToHost(request: NextRequest, hostname: string) {
  const target = new URL(request.url);
  target.hostname = hostname;
  return NextResponse.redirect(target, 307);
}

export const config = {
  // Everything except static files and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|txt|xml|woff2?|ttf|css|js|map|yml)$).*)"],
};
