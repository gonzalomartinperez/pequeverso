import { formatUsd } from "@config/commerce";
import { featuredProduct } from "@/products";

/** The product the hub promotes and the facts every home section reads from the registry. */
export const product = featuredProduct();
export const price = formatUsd(product.pricing.list);
export const composition = product.composition;
/** "3 a 7 años" → "3–7" for compact counters. */
export const ageShort = composition.ageRange.replace(/^(\d+)\s+a\s+(\d+).*$/, "$1–$2");

/** Real page `index` of the registry's list (falls back to the hero render). */
export const pageAt = (index: number): string => product.media.pageIds[index] ?? product.media.hero;

/** The main PDF and the bonuses included in the same price (registry order). */
const [first, ...rest] = product.resources;
export const mainResource = first;
export const bonuses = rest;
