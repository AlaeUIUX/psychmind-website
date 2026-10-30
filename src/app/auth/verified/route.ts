import { NextResponse, type NextRequest } from "next/server";
import { dbReady } from "@/db";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/server/auth/session";

// Where every email-confirmation link lands: the callbackURL given to Better
// Auth (server/auth/actions.ts), with the page to open next in ?next=.
// Better Auth adds ?error= when the link has expired or doesn't check out
// (TOKEN_EXPIRED, INVALID_TOKEN, USER_NOT_FOUND), and comes here signed out
// when the address was already confirmed (a link opened twice). Both used to
// land on log in with nothing said; now log in says what happened.
export async function GET(request: NextRequest) {
  await dbReady;
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const session = await getSession();
  // Confirmed and signed in, just now or from before: carry on.
  if (session?.user.emailVerified) return NextResponse.redirect(new URL(next ?? "/auth/continue", request.url));

  const login = new URL("/login", request.url);
  const error = params.get("error");
  if (error) login.searchParams.set("link", error === "TOKEN_EXPIRED" ? "expired" : "invalid");
  else login.searchParams.set("verified", "1");
  if (next) login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
