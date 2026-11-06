import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/server/auth/session";
import { claimFounding, FOUNDING_COOKIE, FOUNDING_COOKIE_MAX_AGE, foundingLinkStatus } from "@/server/founding";
import { ensureProfile } from "@/server/provider/data";

// The founding link the team sends early providers (server/founding.ts).
// Signed out: remember the code and show the invitation. A signed-in provider
// claims a spot now. Everyone ends on /founding, which explains the outcome.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const show = (s: string) => {
    const url = req.nextUrl.clone();
    url.pathname = "/founding";
    url.search = `?s=${s}`;
    return NextResponse.redirect(url);
  };
  const forget = (res: NextResponse) => {
    res.cookies.delete(FOUNDING_COOKIE);
    return res;
  };

  const session = await getSession();
  if (session?.user.role === "provider") {
    const profile = await ensureProfile(session.user.id);
    if (profile.foundingAt) return forget(show("welcome"));
    const result = await claimFounding(profile.id, code);
    return forget(show(result === "claimed" || result === "already" ? "welcome" : result));
  }

  const status = await foundingLinkStatus(code);
  if (status !== "open") return show(status);
  if (session) return show("providers-only");

  const res = show("invite");
  res.cookies.set(FOUNDING_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: FOUNDING_COOKIE_MAX_AGE,
  });
  return res;
}
