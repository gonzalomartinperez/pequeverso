import { absoluteUrl } from "@config/site";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Indexable routes only; post-purchase and pure legal pages are noindex and excluded. */
export const indexableRoutes = ["/", "/grafismo-fonetico/", "/soporte/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return indexableRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/grafismo-fonetico/" ? 0.9 : 0.4,
  }));
}
