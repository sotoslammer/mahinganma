import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const host = new URL(site.url).host;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The owner area holds student records; the thank-you page is a dead end.
      disallow: ["/admin", "/signup/thanks"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host,
  };
}
