import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Telegram Web Mini App iframe ichida ochiladi, shuning uchun
          // X-Frame-Options ataylab qo'yilmagan.
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), microphone=(self), camera=(self)",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
