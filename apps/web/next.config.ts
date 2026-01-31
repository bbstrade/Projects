import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SITE_URL: "http://localhost:3000",
    CONVEX_SITE_URL: "http://localhost:3000",
  },
};

export default nextConfig;
