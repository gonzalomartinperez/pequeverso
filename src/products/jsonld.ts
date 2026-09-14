/**
 * Structured data for product pages. Only facts the site can stand behind: a `Product` with one
 * `Offer` for indexable core products, and a `BreadcrumbList`. Never merchant-listing fields,
 * ratings or reviews (the site has no reviews and invents no social proof).
 */
import { absoluteUrl, site } from "../../config/site.ts";
import { getImage } from "../lib/media.ts";
import type { CoreProduct, Product } from "./schema.ts";

type JsonLd = Record<string, unknown>;

export function productJsonLd(product: CoreProduct): JsonLd | null {
  if (!product.seo.index) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo.description,
    image: absoluteUrl(getImage(product.media.og ?? product.media.hero).src),
    sku: product.slug,
    brand: { "@type": "Organization", name: site.name },
    offers: {
      "@type": "Offer",
      price: product.pricing.list.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(product.path),
    },
  };
}

export function breadcrumbJsonLd(product: Product): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: product.name, item: absoluteUrl(product.path) },
    ],
  };
}
