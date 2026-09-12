import { checkoutPassthroughParams, checkoutPassthroughPrefixes } from "../../config/commerce.ts";

/**
 * Builds the checkout URL for a CTA: the configured Hotmart URL plus the allowlisted
 * acquisition parameters found in the current page URL. `off`/`ref` are never
 * forwarded (they would let a visitor select an arbitrary Hotmart offer).
 */
export function buildCheckoutUrl(
  base: string,
  pageSearch: string,
  extra: Record<string, string> = {},
): string {
  if (!base) return "";
  const url = new URL(base);
  const incoming = new URLSearchParams(pageSearch);
  for (const [key, value] of incoming.entries()) {
    if (!value) continue;
    if (isAllowedParam(key) && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function isAllowedParam(key: string): boolean {
  const lower = key.toLowerCase();
  if ((checkoutPassthroughParams as readonly string[]).includes(lower)) return true;
  return checkoutPassthroughPrefixes.some((prefix) => lower.startsWith(prefix));
}

/** Keeps allowlisted acquisition params when linking between internal pages (hub → landing). */
export function withPassthrough(path: string, pageSearch: string): string {
  const incoming = new URLSearchParams(pageSearch);
  const kept = new URLSearchParams();
  for (const [key, value] of incoming.entries()) if (value && isAllowedParam(key)) kept.set(key, value);
  const query = kept.toString();
  return query ? `${path}?${query}` : path;
}

/** Hotmart `sck` is limited to 30 characters. */
export function sckFor(position: string): string {
  return `pv-gf-${position}`.replace(/[^a-z0-9-]/gi, "").slice(0, 30);
}
