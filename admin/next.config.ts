import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel serverless platformasi uchun output undefined qilinadi, Docker build uchun standalone
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
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  async rewrites() {
    const rawUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").trim();

    // Vercel muhitida NEXT_PUBLIC_API_URL o'rnatilmagan bo'lsa, o'z-o'ziga (self-rewrite) xatosini oldini olish
    if (!rawUrl && process.env.VERCEL) {
      return [];
    }

    let cleanUrl = (rawUrl || "http://localhost:4000").replace(/\/+$/, "");
    if (cleanUrl.endsWith("/api")) {
      cleanUrl = cleanUrl.slice(0, -4);
    }

    if (!cleanUrl || cleanUrl === "/api" || cleanUrl.startsWith("/")) {
      return [];
    }

    const destination = `${cleanUrl}/api/:path*`;
    if (destination === "/api/:path*") {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination,
      },
    ];
  },
};

export default nextConfig;
