import { absoluteUrl } from "@config/site";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Never disallow noindex pages: crawlers must be able to read the noindex directive. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
