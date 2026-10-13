import { formatUsd } from "@config/commerce";
import { featuredProduct } from "@/products";

/** Grafismo Fonético (the hub's own product) and the facts its chapter reads from the registry. */
export const product = featuredProduct();
export const price = formatUsd(product.pricing.list);
export const composition = product.composition;

/** Real page `index` of the registry's list (falls back to the hero render). */
export const pageAt = (index: number): string => product.media.pageIds[index] ?? product.media.hero;

/** The bonuses included in the same price as the main PDF (registry order, main PDF first). */
export const bonuses = product.resources.slice(1);
