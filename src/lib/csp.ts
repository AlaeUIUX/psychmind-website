// Content-Security-Policy: what a page may load and run, enforced by the
// browser. It's the backstop if something ever lets an attacker inject HTML.
// - Portal pages (accounts, admin, documents) get a per-request nonce with
//   'strict-dynamic': only scripts Next tags with that nonce, and what they
//   load, can run — an injected <script> can't.
// - Marketing pages are pre-rendered (no per-request nonce), so they allow our
//   own inline scripts but still no third-party scripts, plugins or framing.
// /cms (Decap, loaded from a CDN) gets no CSP; it's a separate static app.

const dev = process.env.NODE_ENV === "development";

export function contentSecurityPolicy(nonce: string | null) {
  const scripts = nonce ? [`'nonce-${nonce}'`, "'strict-dynamic'"] : ["'self'", "'unsafe-inline'"];
  // React's dev tooling needs eval; production never does.
  if (dev) scripts.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    `script-src ${scripts.join(" ")}`,
    // Inline style attributes are everywhere in React; styles can't run code.
    "style-src 'self' 'unsafe-inline'",
    // blob: for upload previews; Google profile photos; sample-provider photos.
    "img-src 'self' blob: data: https://images.unsplash.com https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
