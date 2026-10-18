/**
 * Pack Imprime y Juega — the optional post-purchase offer of Grafismo Fonético. The Hotmart
 * sales-funnel widget is the only decision control; the site never links to its checkout.
 * Prices: Hotmart upload manifest 2026-07-26 and the published offer page.
 */
import { packCopy } from "../../content/es/products/imprime-y-juega/copy.ts";
import { packResources } from "../../content/es/products/imprime-y-juega/resources.ts";
import { mediaSequence, type ProductInput } from "./schema.ts";

export const imprimeYJuega = {
  kind: "post-purchase-offer",
  slug: "imprime-y-juega",
  code: "pack",
  name: "Pack Imprime y Juega",
  shortName: "Imprime y Juega",
  composition: { pdfCount: 6, pageCount: 384, ageRange: "3 a 7 años", visibleResources: 9 },
  media: {
    hero: "pack.hero",
    pageIds: mediaSequence("pack.page", 12),
    videoIds: [],
    cards: packResources.map((resource) => resource.card),
  },
  seo: {
    index: false,
    title: "Pack Imprime y Juega | 384 páginas de actividades",
    description:
      "Seis PDF con 384 páginas y nueve recursos para casa, viajes, esperas, creatividad, observación, valores y juego. Oferta opcional después de comprar Grafismo Fonético.",
    priority: 0,
  },
  pricing: { upsell: 14.99, downsell: 7.49 },
  parent: "grafismo-fonetico",
  decision: "hotmart-widget",
  resources: packResources,
  copy: packCopy,
} satisfies ProductInput;
