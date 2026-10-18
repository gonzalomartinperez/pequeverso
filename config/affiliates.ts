/**
 * Third-party products Pequeverso recommends as a Hotmart affiliate (docs/affiliates.md).
 * There is no landing of our own: `path` is the clean redirect in `config/edge-rules.json`
 * (`destinationEnv`), which sends the visitor to the owner's affiliate link. The link itself is
 * a deployment value and never lives in the repository.
 *
 * Facts come from the producer's public Hotmart page, owner-supplied producer copy
 * (2026-10-18), and the owner's decision
 * (pequeverso-marketing `decisions/DEC-2026-10-12-afiliado-alimentacion-bebes.md`). No price,
 * reviews, ratings or health outcomes: only what the course covers.
 */
export type AffiliateProduct = {
  /** Event `product` parameter and stable key. */
  slug: string;
  /** Redirect path on pequeverso.com (must match an edge rule with `destinationEnv`). */
  path: `/${string}/`;
  /** Build variable the redirect reads (documented in docs/deployment.md). */
  destinationEnv: string;
  /** Public course name as the producer publishes it. */
  name: string;
  /** Who it is for, in the producer's terms. */
  audience: string;
  /** Short stage label for chips and menus (the age range of `audience`). */
  stage: string;
  /** Platform that sells, delivers and refunds the product. */
  platform: "Hotmart";
  /** Refund guarantee set on the producer's Hotmart product (days). */
  guaranteeDays: number;
  /** What the course teaches (3–4 short points, no promises). */
  topics: readonly string[];
  /** Optional course facts attributed to producer copy, not an independent credential check. */
  details?: {
    producerName: string;
    modules: readonly string[];
    bonuses: readonly string[];
    evidence: {
      kind: "owner-supplied-producer-copy";
      receivedOn: string;
      independentlyVerified: false;
    };
  };
  /** `src` value appended to the redirect path so Hotmart reports show the placement. */
  source: string;
  /**
   * Manifest ids used on the home (docs/specs/home-hub.md): the hero figure, the chapter scene,
   * the menu scene and the transparent cut-outs (devices, bowl, food planet).
   */
  media: { figure: string; photo: string; menu: string; device: string; detail: string; planet: string };
};

export const alimentacionBebe = {
  slug: "alimentacion-bebe",
  path: "/alimentacion-bebe/",
  destinationEnv: "NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE",
  name: "Guía de Alimentación para Bebés",
  audience: "Alimentación complementaria de 6 a 12 meses",
  stage: "6 a 12 meses",
  platform: "Hotmart",
  guaranteeDays: 7,
  topics: [
    "Alimentación complementaria y Baby Led Weaning (BLW).",
    "Nutrición, cantidades y frecuencias de las comidas.",
    "Un menú para las primeras 4 semanas.",
    "Recetas fáciles para el bebé y toda la familia.",
  ],
  details: {
    producerName: "Citlalli Moctezuma",
    modules: [
      "Bienvenida y presentación del programa",
      "Cuándo iniciar la alimentación complementaria",
      "Baby Led Weaning (BLW)",
      "Nutrición por grupos de alimentos",
      "Preparaciones sencillas y menú de cuatro semanas",
      "Preguntas frecuentes y recetas",
    ],
    bonuses: [
      "Transición al método en tres pasos",
      "Cómo elegir una silla para comer",
      "Utensilios de cocina",
      "Cómo elegir platos y vasos",
    ],
    evidence: {
      kind: "owner-supplied-producer-copy",
      receivedOn: "2026-10-18",
      independentlyVerified: false,
    },
  },
  source: "sitio-home",
  media: {
    figure: "bebe.cutout.mama-brazos",
    photo: "bebe.scene.primera-papilla",
    menu: "bebe.scene.menu",
    device: "bebe.cutout.dispositivos",
    detail: "bebe.cutout.bol",
    planet: "bebe.cutout.planeta",
  },
} as const satisfies AffiliateProduct;

/** Every recommended affiliate product (one block each). */
export const affiliates: readonly AffiliateProduct[] = [alimentacionBebe];

/** Redirect path with the placement `src` (Hotmart keeps it in the sale's tracking source). */
export function affiliateHref(product: AffiliateProduct): string {
  return `${product.path}?src=${encodeURIComponent(product.source)}`;
}

/** Example path for legal copy, without the trailing slash (`/alimentacion-bebe`). */
export const affiliateExamplePath = alimentacionBebe.path.replace(/\/$/, "");
