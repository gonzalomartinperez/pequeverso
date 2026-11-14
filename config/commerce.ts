/**
 * Commercial facts shared by every product. Per-product facts (prices, composition, checkout,
 * funnel) live in the registry (`config/products/<slug>.ts`). The guarantee period is the
 * documented value as of 2026-09-12; changing it is a business decision that must match the
 * Hotmart product setting (see docs/legal-checklist.md).
 *
 * Hotmart is the merchant of record for payment, taxes, delivery and refunds.
 */
export const currency = "USD" as const;

/** Days to request a refund through Hotmart, as promised on the current landings. */
export const guaranteeDays = 7;

/**
 * Longer legal withdrawal windows (PV-D2, OD-50). Hotmart allows one global guarantee
 * (`guaranteeDays`, automatic refund in Hotmart); these windows are honored manually: the buyer
 * emails support and the owner refunds outside Hotmart's automatic window. Only periods read on a
 * primary source (content/es/legal/consumer-rights.ts, docs/legal-checklist.md) are listed; a
 * country that is not here has no verified period and is covered by the 7-day guarantee. `country`
 * matches the consumer-rights row name. Never state one of these periods outside config.
 */
export type WithdrawalWindow = {
  country: string;
  days: number;
  /** Day count as the statute states it: "días corridos", "días naturales", "días hábiles", "días". */
  unit: string;
};
export const withdrawalWindows: readonly WithdrawalWindow[] = [
  { country: "Argentina", days: 10, unit: "días corridos" },
  { country: "Brasil", days: 7, unit: "días" },
  { country: "Chile", days: 10, unit: "días" },
  { country: "Colombia", days: 5, unit: "días hábiles" },
  { country: "España", days: 14, unit: "días naturales" },
  { country: "Unión Europea (resto de países)", days: 14, unit: "días" },
  { country: "Uruguay", days: 5, unit: "días hábiles" },
];

/** "10 días corridos": the period of a window as customer copy states it. */
export function withdrawalPeriod(window: WithdrawalWindow): string {
  return `${window.days} ${window.unit}`;
}

/** Window of a country by its consumer-rights row name; throws when config has none. */
export function withdrawalWindow(country: string): WithdrawalWindow {
  const found = withdrawalWindows.find((window) => window.country === country);
  if (!found) throw new Error(`No withdrawal window configured for ${country}`);
  return found;
}

/** Argentine request code (Disposición SSDCyLC 954/2025 art. 5): sent within this many hours, by
 * the same channel the buyer used. The code's own numbering scheme is an owner input. */
export const withdrawalRequestCodeHours = 24;

/** Normal support reply time (previously `seller.responseTime`). */
export const supportResponseTime = "48 horas hábiles";

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

/**
 * Local-currency explanation shown next to every USD price: Hotmart converts the reference
 * price to the buyer's currency and shows the final total (taxes included) before payment.
 */
export const localCurrencyNote =
  "Precio de referencia en dólares (USD). Hotmart lo convierte a tu moneda local y muestra el total final, con impuestos, antes de pagar.";

/** Short variant of `localCurrencyNote` for tight spaces (sticky bar, tooltips, chips). */
export const localCurrencyNoteShort = "Se cobra en tu moneda local.";

/** Customer-facing USD price with the Spanish decimal comma, e.g. `US$14,99`. */
export function formatUsd(value: number): string {
  return `US$${value.toFixed(2).replace(".", ",")}`;
}
