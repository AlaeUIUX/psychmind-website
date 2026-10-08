import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { appHost, isAppPath, isProtectedPath, isSharedPath, marketingHost } from "@/lib/hosts";

// 1. Host routing (see lib/hosts.ts): portal pages live on the app host,
//    marketing pages on www. Each redirects to the other, keeping the path.
// 2. Optimistic gate for signed-in areas: no session cookie → log in (keeping
//    where they were going). Real checks — valid session, verified email,
//    role — happen in the pages and actions (src/server/auth/session.ts).
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;
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
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path + url.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
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
