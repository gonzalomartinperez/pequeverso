/**
 * Seller identity for the legal pages, supplied by the owner on 2026-09-24 with consent to publish
 * it on the site and in the public repository (docs/legal-checklist.md). A single mailbox handles
 * support, privacy and withdrawal ("arrepentimiento") requests. Pages read every fact from here;
 * none of them retypes a value.
 */
export const seller = {
  brand: "Pequeverso",
  /** The Titular: a natural person ("persona humana") who sells under the Pequeverso brand. */
  legalName: "Gonzalo Martín Pérez",
  personType: "persona humana",
  taxIdLabel: "CUIL",
  taxId: "23-43891426-9",
  address:
    "Humberto Primo 445, departamento 5, B8000 Bahía Blanca, provincia de Buenos Aires, República Argentina",
  country: "República Argentina",
  /** Courts named in the jurisdiction clause; never displaces the consumer's own forum. */
  jurisdiction:
    "los tribunales ordinarios del Departamento Judicial de Bahía Blanca, provincia de Buenos Aires",
  supportEmail: "somospequeverso@gmail.com",
  privacyEmail: "somospequeverso@gmail.com",
  /**
   * The Titular's own mailbox, registered in the seller's Hotmart account (Hotmart forwards buyer
   * contacts there). Secondary channel shown on the legal pages only (`legalRoutes`); commercial
   * pages, footer, soporte and config/site.ts show `supportEmail` alone (unit + rendered checks).
   */
  legalEmail: "gonzalomartinperez2002@gmail.com",
  legalEmailLabel: "Correo del titular (cuenta de Hotmart)",
  responseTime: "48 horas hábiles",
  updatedAt: "24 de septiembre de 2026",
} as const;

/** Routes allowed to render `seller.legalEmail` (checked by tests/unit and scripts/check-rendered.ts). */
export const legalRoutes = [
  "/aviso-legal/",
  "/privacidad/",
  "/cookies/",
  "/terminos/",
  "/compras-y-reembolsos/",
  "/arrepentimiento/",
] as const;

/** "Gonzalo Martín Pérez (CUIL 23-43891426-9)": the identification used in running text. */
export const sellerIdentity = `${seller.legalName} (${seller.taxIdLabel} ${seller.taxId})`;
