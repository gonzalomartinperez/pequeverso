/**
 * Seller identity for legal pages. Every [[PLACEHOLDER]] must be supplied by the owner before
 * launch (docs/legal-checklist.md); the deploy workflow refuses to ship placeholders. A single
 * mailbox handles support and privacy requests.
 */
export const seller = {
  brand: "Pequeverso",
  legalName: "[[RAZON_SOCIAL]]",
  taxId: "[[NIF_CUIT]]",
  address: "[[DOMICILIO]]",
  country: "[[PAIS]]",
  jurisdiction: "[[JURISDICCION]]",
  supportEmail: "somospequeverso@gmail.com",
  privacyEmail: "somospequeverso@gmail.com",
  responseTime: "48 horas hábiles",
  updatedAt: "20 de septiembre de 2026",
} as const;

const PLACEHOLDER = /^\[\[[A-Z0-9_]+\]\]$/;

/** True while the owner has not supplied the value (still a double-bracketed upper-case token). */
export function isPending(value: string): boolean {
  return PLACEHOLDER.test(value);
}

/** Renders a seller field for display; unfilled placeholders read as "pendiente de publicación". */
export function sellerField(value: string): string {
  return isPending(value) ? "pendiente de publicación" : value;
}

/** True while any identification field of the seller is still a placeholder. */
export const sellerIdentityPending = [seller.legalName, seller.taxId, seller.address].some(isPending);

/** True while the governing-law fields (country, courts) are still placeholders. */
export const sellerLawPending = [seller.country, seller.jurisdiction].some(isPending);
