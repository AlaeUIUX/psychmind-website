import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return new NextResponse("Missing OAuth code or credentials", { status: 400 });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return new NextResponse(
      `GitHub OAuth error: ${tokenData.error_description ?? "unknown error"}`,
      { status: 400 }
    );
  }

  // Decap CMS's github backend expects a two-step postMessage handshake from
  // this popup: it waits for us to announce "authorizing:github", replies on
  // the same channel, and only then do we send the token back to the opener.
  const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });
  const message = JSON.stringify(`authorization:github:success:${payload}`);

  const html = `<!DOCTYPE html>
<html>
  <body>
    <script>
      (function() {
        function receiveMessage(e) {
          window.opener.postMessage(${message}, e.origin);
          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
