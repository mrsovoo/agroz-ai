import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://agroz.uz";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/agrozgo", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/dorilar", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/mutaxassislar", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/ob-havo", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/biznes", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/hamkorlik", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/maxfiylik", priority: 0.4, changeFrequency: "monthly" as const },
    { path: "/shartlar", priority: 0.4, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

