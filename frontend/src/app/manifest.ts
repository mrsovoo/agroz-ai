import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agroz AI — Dehqon va chorvador yordamchisi",
    short_name: "Agroz",
    description:
      "Ekin va chorva dori vositalari platformasi, yaqin dorixonalar va mutaxassislar xaritasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f3f5",
    theme_color: "#fcbd00",
    lang: "uz",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
