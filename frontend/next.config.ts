import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Telegram Web Mini App iframe ichida ochiladi, shuning uchun X-Frame-Options qo'yilmagan.
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), microphone=(self), camera=(self)",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const rawUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").trim();

    // Agar to'liq http:// yoki https:// URL berilmagan bo'lsa:
    // Production / Vercel build vaqtida Invalid Rewrite xatosi bermasligi uchun empty array qaytaramiz.
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

    const destination = `${cleanUrl}/api/:path*`;

    return [
      {
        source: "/api/:path*",
        destination,
      },
    ];
  },
};

export default nextConfig;
