import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgrozGO — Dehqon va chorvador yordamchisi",
    short_name: "AgrozGO",
    description:
      "Ekin va chorva dorilari platformasi, yaqin agro-do'konlar va mutaxassislar xaritasi.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#039e1e",
    lang: "uz",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
