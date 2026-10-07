// Shared bits of the Decap CMS GitHub OAuth popup (/api/auth → GitHub →
// /api/callback). The callback hands a repo-scoped GitHub token to the CMS
// window that opened it, so two checks guard it:
//   1. `state`: a random value set as an httpOnly cookie on /api/auth and
//      echoed back by GitHub, so a callback can't be forged or replayed.
//   2. Origin allow-list: the token is only posted to a CMS page served from
//      one of our own origins, never to whatever window happens to ask.

export const STATE_COOKIE = "cms_oauth_state";

/** Origins allowed to receive the token: this deployment plus the public site.
 *  Extra origins (e.g. a preview domain) can be added via CMS_ALLOWED_ORIGINS,
 *  comma-separated. */
export function allowedOrigins(requestOrigin: string): string[] {
  const extra = (process.env.CMS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return Array.from(
    new Set([requestOrigin, "https://psychmind.org", "https://www.psychmind.org", ...extra]),
  );
}

/** The popup page: announces itself to the opener, waits for the CMS to
 *  answer, and posts the result only if the answer came from the opener on an
 *  allowed origin. `message` is the full Decap message string. */
export function handshakePage(message: string, origins: string[]): string {
  // JSON.stringify output is safe inside <script> once "<" is escaped.
  const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html>
  <body>
    <script>
      (function () {
        var allowed = ${json(origins)};
        var message = ${json(message)};
        function receiveMessage(e) {
          if (e.source !== window.opener || allowed.indexOf(e.origin) === -1) return;
          window.removeEventListener("message", receiveMessage, false);
          window.opener.postMessage(message, e.origin);
        }
        if (!window.opener) return;
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`;
}
