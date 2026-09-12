/**
 * Seller identity for legal pages. Every [[PLACEHOLDER]] must be supplied by the owner before
 * launch (docs/legal-checklist.md); the deploy workflow refuses to ship placeholders.
 */
export const seller = {
  brand: "Pequeverso",
  operator: "Digital Products Team",
  legalName: "[[RAZON_SOCIAL]]",
  taxId: "[[NIF_CUIT]]",
  address: "[[DOMICILIO]]",
  country: "[[PAIS]]",
  jurisdiction: "[[JURISDICCION]]",
  supportEmail: "support@digitalproductsteam.com",
  privacyEmail: "privacy@digitalproductsteam.com",
  responseTime: "48 horas hábiles",
  updatedAt: "12 de septiembre de 2026",
} as const;

/** Renders a seller field for display; unfilled placeholders read as "pendiente de publicación". */
export function sellerField(value: string): string {
  return /^\[\[[A-Z0-9_]+\]\]$/.test(value) ? "pendiente de publicación" : value;
}
