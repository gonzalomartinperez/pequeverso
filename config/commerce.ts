/**
 * Commercial facts shared by every product. Per-product facts (prices, composition, checkout,
 * funnel) live in the registry (`src/products/<slug>.ts`). The guarantee period is the
 * documented value as of 2026-09-12; changing it is a business decision that must match the
 * Hotmart product setting (see docs/legal-checklist.md).
 *
 * Hotmart is the merchant of record for payment, taxes, delivery and refunds.
 */
export const currency = "USD" as const;

/** Days to request a refund through Hotmart, as promised on the current landings. */
export const guaranteeDays = 7;

/** Query parameters forwarded from the landing URL to the Hotmart checkout. `off` and
 * `ref` are deliberately excluded: a visitor-controlled `off` selects an arbitrary offer. */
export const checkoutPassthroughParams = [
  "a",
  "angle_key",
  "ad_code",
  "country",
  "sck",
  "src",
  "xcod",
  "fbclid",
] as const;
export const checkoutPassthroughPrefixes = ["utm_"] as const;

/** Hotmart buyer area and refund entry points (public Hotmart URLs). */
export const hotmart = {
  consumerArea: "https://consumer.hotmart.com/",
  refunds: "https://refund.hotmart.com/",
  /** Sales-funnel widget library. The widget renders Hotmart's own Sí/No decision; the
   * page never links directly to an upsell or downsell checkout. */
  salesFunnelScript: "https://checkout.hotmart.com/lib/hotmart-checkout-elements.js",
  salesFunnelContainerId: "hotmart-sales-funnel",
} as const;

export function formatUsd(value: number): string {
  return `US$${value.toFixed(2)}`;
}
