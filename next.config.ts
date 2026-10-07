import type { NextConfig } from "next";

// Baseline security headers for every route. A full Content-Security-Policy
// comes with the hardening slice, once every third-party origin (Supabase,
// Stripe, Sentry) is known.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Geolocation stays available to our own pages ("Use my location" in search).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  images: {
    // Sample-provider photos are served from Unsplash's CDN (see src/lib/photos.ts).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Decap CMS (company blog posts) lives at /cms; /admin is reserved for
    // the admin dashboard.
    return [
      { source: "/cms", destination: "/cms/index.html" },
      { source: "/cms/", destination: "/cms/index.html" },
    ];
  },
};

export default nextConfig;
