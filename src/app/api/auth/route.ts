import { NextRequest, NextResponse } from "next/server";
import { STATE_COOKIE } from "@/lib/cms-oauth";

// Step 1 of the Decap CMS GitHub login: send the editor to GitHub with a
// one-time `state` that /api/callback will check.
export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new NextResponse("Missing GITHUB_OAUTH_CLIENT_ID environment variable", {
      status: 500,
    });
  }

  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/api/callback`;
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo,user");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/callback",
    maxAge: 600,
  });
  return response;
}
