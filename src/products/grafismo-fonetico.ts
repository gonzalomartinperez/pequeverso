/**
 * Grafismo Fonético — the principal product. Prices and composition are the documented values
 * (ai-business-ops product README 2026-08-04, Hotmart upload manifest 2026-07-24, live landing);
 * changing them is a business decision to record in docs/decisions.
 */
import { grafismoCopy } from "../../content/es/products/grafismo-fonetico/copy.ts";
import { grafismoResources } from "../../content/es/products/grafismo-fonetico/resources.ts";
import { mediaSequence, type ProductInput } from "./schema.ts";

export const grafismoFonetico = {
  kind: "core",
  slug: "grafismo-fonetico",
  code: "gf",
  name: "Grafismo Fonético",
  shortName: "Grafismo Fonético",
  checkoutTitle: "Kit Grafismo Fonético: Aprende Letras, Sonidos y Sílabas",
  composition: { pdfCount: 9, pageCount: 414, ageRange: "3 a 7 años" },
  media: {
    hero: "gf.hero",
    scenes: { problem: "gf.scene.mesa", credibility: "gf.scene.trazo" },
    pageIds: mediaSequence("gf.page", 20),
    videoIds: ["video.gf.bota", "video.gf.mapa", "video.gf.paloma", "video.gf.maleta"],
    cards: grafismoResources.map((resource) => resource.card),
  },
  seo: {
    index: true,
    title: "Grafismo Fonético | Kit imprimible para los primeros pasos hacia la lectura",
    description:
      "Kit imprimible de 9 PDF y 414 páginas para practicar letras, sonidos, sílabas, palabras y trazos en casa, 10 minutos por día. Para niños de 3 a 7 años. Acceso digital inmediato.",
    priority: 0.9,
  },
  pricing: { list: 14.99 },
  checkout: {
    envKey: "NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO",
    url: process.env.NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO || process.env.NEXT_PUBLIC_CHECKOUT_URL || "",
    offer: "main-usd-14-99",
    sckPrefix: "gf",
  },
  funnel: { thanksPath: "/grafismo-fonetico/gracias/", postPurchaseOffer: "imprime-y-juega" },
  resources: grafismoResources,
  copy: grafismoCopy,
} satisfies ProductInput;
