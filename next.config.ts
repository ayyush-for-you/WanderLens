import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            // Allow camera (and microphone) on this origin.
            // The empty string for microphone means "this origin only" (not delegated to iframes).
            key: "Permissions-Policy",
            value: "camera=*, microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
