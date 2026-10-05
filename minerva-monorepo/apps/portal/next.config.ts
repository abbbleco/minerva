import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Retired Hermes route → Minerva. Permanent: old bookmarks follow.
    return [{ source: "/hermes", destination: "/minerva", permanent: true }];
  },
};

export default nextConfig;

