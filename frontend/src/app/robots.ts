import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/kabinet/"],
      },
    ],
    sitemap: "https://agroz.uz/sitemap.xml",
    host: "https://agroz.uz",
  };
}

