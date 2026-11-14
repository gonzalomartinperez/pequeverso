import { pageReviewed } from "@config/content-dates.ts";
import { indexableProducts } from "@config/products/index.ts";
import { absoluteUrl } from "@config/site.ts";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

type Route = {
  path: string;
  priority: number;
  reviewed: string;
  changeFrequency: "weekly" | "monthly";
};

function reviewedOf(date: string | undefined, path: string): string {
  if (!date) throw new Error(`indexable product ${path} has no seo.lastReviewed`);
  return date;
}

/** Indexable routes only; post-purchase and the purchase/legal pages are noindex and excluded. */
function indexableRoutes(): Route[] {
  return [
    { path: "/", priority: 1, reviewed: pageReviewed.home, changeFrequency: "weekly" },
    ...indexableProducts().map(
      (product): Route => ({
        path: product.path,
        priority: product.seo.priority,
        reviewed: reviewedOf(product.seo.lastReviewed, product.path),
        changeFrequency: "monthly",
      }),
    ),
    {
      path: "/soporte/",
      priority: 0.4,
      reviewed: pageReviewed.support,
      changeFrequency: "monthly",
    },
    {
      path: "/accesibilidad/",
      priority: 0.3,
      reviewed: pageReviewed.accessibility,
      changeFrequency: "monthly",
    },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(`${route.reviewed}T00:00:00Z`),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
