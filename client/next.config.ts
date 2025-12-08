import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ IMPORTANT: do NOT use output: "export"
  // This app uses SSR / API calls

  // Use Turbopack (default in Next.js 16) for dev, silencing warning about webpack config
  // (PWA is disabled in dev anyway)
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    exclude: [/middleware-manifest\.json$/],
  },
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
