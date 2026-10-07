import { NextRequest, NextResponse } from "next/server";
import { allowedOrigins, handshakePage, STATE_COOKIE } from "@/lib/cms-oauth";

// Step 2 of the Decap CMS GitHub login: check `state`, swap the code for a
// token, and hand it to the CMS window that opened this popup — only if that
// window is on one of our own origins (see lib/cms-oauth.ts).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse("Missing OAuth credentials", { status: 500 });
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return new NextResponse("Invalid or expired login attempt. Close this window and try again.", {
      status: 400,
    });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));

  // Decap CMS's github backend expects a two-step postMessage handshake: we
  // announce "authorizing:github", the CMS replies, then we send the result.
  const message = tokenData.access_token
    ? `authorization:github:success:${JSON.stringify({ token: tokenData.access_token, provider: "github" })}`
    : `authorization:github:error:${JSON.stringify({ message: "GitHub login failed" })}`;

  const response = new NextResponse(handshakePage(message, allowedOrigins(request.nextUrl.origin)), {
    status: tokenData.access_token ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
  response.cookies.delete({ name: STATE_COOKIE, path: "/api/callback" });
  return response;
}
