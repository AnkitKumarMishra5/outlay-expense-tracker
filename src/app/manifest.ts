import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Outlay",
    short_name: "Outlay",
    description: "Expense tracker, validator and analyser for Indian credit card statements.",
    start_url: "/",
    display: "standalone",
    background_color: "#080d15",
    theme_color: "#080d15",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
