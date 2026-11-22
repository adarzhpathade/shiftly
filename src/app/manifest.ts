import type { MetadataRoute } from "next";
import { BRAND_CREAM, BRAND_INK } from "@/styles/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "shiftly",
    short_name: "shiftly",
    description:
      "Small habits, big wins. Customer-service training that feels like a game.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND_CREAM,
    theme_color: BRAND_INK,
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
