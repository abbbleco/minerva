import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The channel protocol addresses objects by key, and every key a client may
  // request is validated in the route handler against the same grammar the
  // publisher and the desktop decoder use. Nothing here may rewrite a key: a
  // redirect would hand a client an authority it never asked for, which is the
  // one thing the desktop's resolver refuses to follow (redirect: "error").
  async headers() {
    return [
      {
        // Artifacts are immutable under releases/channel-builds/<buildId>/, and
        // the publisher never rewrites a published key. Long cache on the
        // immutable prefix only; channel records are revalidated every time.
        source: "/releases/channel-builds/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/releases/channels/:channel",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
