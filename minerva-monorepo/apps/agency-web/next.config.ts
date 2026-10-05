import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp must load as a native runtime dependency inside Server Actions,
  // never bundled by Turbopack.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
