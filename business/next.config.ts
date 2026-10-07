import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const rawUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").trim();

    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      if (process.env.NODE_ENV === "development") {
        return [
          {
            source: "/api/:path*",
            destination: "http://localhost:4000/api/:path*",
          },
        ];
      }
      return [];
    }

    let cleanUrl = rawUrl.replace(/\/+$/, "");
    if (cleanUrl.endsWith("/api")) {
      cleanUrl = cleanUrl.slice(0, -4);
    }

    return [
      {
        source: "/api/:path*",
        destination: `${cleanUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

