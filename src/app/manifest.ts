import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgroVet AI — Dehqon va chorvador yordamchisi",
    short_name: "AgroVet",
    description:
      "Sun'iy intellekt yordamida ekin va chorva kasalliklariga tashxis, yaqin dorixonalar va veterinarlar xaritasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f3f5",
    theme_color: "#fcbd00",
    lang: "uz",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
