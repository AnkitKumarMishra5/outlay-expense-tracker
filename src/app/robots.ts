import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PRIVATE = ["/dashboard", "/upload", "/statements", "/transactions", "/settings", "/onboarding", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
