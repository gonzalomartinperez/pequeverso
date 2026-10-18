/**
 * The product registry: every product module parsed and cross-checked once at build time.
 * Server-only (Zod and the media manifest never reach client bundles); client islands receive
 * plain props from the templates in `src/features/landing`.
 */
import { grafismoFonetico } from "./grafismo-fonetico.ts";
import { imprimeYJuega } from "./imprime-y-juega.ts";
import { type CoreProduct, type OfferProduct, type Product, RegistrySchema } from "./schema.ts";

function withPath<T extends { slug: string }>(product: T): T & { path: string } {
  return { ...product, path: `/${product.slug}/` };
}

/** Every product, in funnel order (core products first, then their offers). */
export const products: readonly Product[] = RegistrySchema.parse([grafismoFonetico, imprimeYJuega]).map(
  withPath,
);

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function coreProducts(): CoreProduct[] {
  return products.filter((product): product is CoreProduct => product.kind === "core");
}

export function offerProducts(): OfferProduct[] {
  return products.filter((product): product is OfferProduct => product.kind === "post-purchase-offer");
}

export function indexableProducts(): Product[] {
  return products.filter((product) => product.seo.index);
}

/** The product the hub promotes: the first core product of the registry. */
export function featuredProduct(): CoreProduct {
  const first = coreProducts()[0];
  if (!first) throw new Error("products: the registry declares no core product");
  return first;
}

/** Where a checkout CTA points when no checkout URL is configured (public clones). */
export function checkoutFallbackPath(product: CoreProduct): string {
  return `${product.path}#comprar`;
}
