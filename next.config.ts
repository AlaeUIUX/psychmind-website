import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sample-provider photos are served from Unsplash's CDN (see src/lib/photos.ts).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin/index.html" },
      { source: "/admin/", destination: "/admin/index.html" },
    ];
  },
};

export default nextConfig;
