import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate for signed-in areas: no session cookie → straight to login
// (keeping where they were going). Real checks — valid session, verified
// email, role — happen in the pages and actions (src/server/auth/session.ts).
export function proxy(request: NextRequest) {
  const cookie = getSessionCookie(request, { cookiePrefix: "psychmind" });
  if (!cookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/provider/:path*", "/account/:path*", "/admin/:path*"],
};
