/**
 * Commercial facts for the funnel. Prices, composition and the guarantee period are
 * the documented values as of 2026-09-12 (ai-business-ops product README 2026-08-04
 * and the live landings). Changing any of them is a business decision, not a code
 * change: update here and record the decision in docs/decisions.
 *
 * Hotmart is the merchant of record for payment, taxes, delivery and refunds.
 */
export const currency = "USD" as const;

export const products = {
  grafismoFonetico: {
    slug: "grafismo-fonetico",
    name: "Grafismo Fonético",
    /** Public title used on the Hotmart checkout page. */
    checkoutTitle: "Kit Grafismo Fonético: Aprende Letras, Sonidos y Sílabas",
    price: 14.99,
    pdfCount: 9,
    pageCount: 414,
    ageRange: "3 a 7 años",
  },
  imprimeYJuega: {
    slug: "imprime-y-juega",
    name: "Pack Imprime y Juega",
    upsellPrice: 14.99,
    downsellPrice: 7.49,
    pdfCount: 6,
    pageCount: 384,
    visibleResources: 9,
    ageRange: "3 a 7 años",
  },
} as const;

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

/** Principal checkout. Public clones without the variable get a safe fallback that keeps the CTA on-site. */
export const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL || "";

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
