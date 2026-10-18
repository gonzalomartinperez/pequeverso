import { indexableProducts } from "@config/products/index.ts";
import { absoluteUrl } from "@config/site.ts";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

type Route = { path: string; priority: number; changeFrequency: "weekly" | "monthly" };

/** Indexable routes only; post-purchase and pure legal pages are noindex and excluded. */
function indexableRoutes(): Route[] {
  return [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    ...indexableProducts().map(
      (product): Route => ({
        path: product.path,
        priority: product.seo.priority,
        changeFrequency: "monthly",
      }),
    ),
    { path: "/soporte/", priority: 0.4, changeFrequency: "monthly" },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return indexableRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
