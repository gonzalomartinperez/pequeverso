/**
 * Third-party products Pequeverso recommends as a Hotmart affiliate (docs/affiliates.md).
 * There is no landing of our own: `path` is the clean redirect in `config/edge-rules.json`
 * (`destinationEnv`), which sends the visitor to the owner's affiliate link. The link itself is
 * a deployment value and never lives in the repository.
 *
 * Facts come from the producer's public Hotmart page and the owner's decision
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
  /** Platform that sells, delivers and refunds the product. */
  platform: "Hotmart";
  /** Refund guarantee set on the producer's Hotmart product (days). */
  guaranteeDays: number;
  /** What the course teaches (3–4 short points, no promises). */
  topics: readonly string[];
  /** `src` value appended to the redirect path so Hotmart reports show the placement. */
  source: string;
  /**
   * Manifest ids used by the site block: the landscape photo (phones and tablets), the portrait
   * art of the same scene (desktop column) and the transparent cut-outs.
   */
  media: { photo: string; photoTall: string; device: string; detail: string };
};

export const alimentacionBebe = {
  slug: "alimentacion-bebe",
  path: "/alimentacion-bebe/",
  destinationEnv: "NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE",
  name: "Guía de Alimentación para Bebés",
  audience: "Alimentación complementaria de 6 a 12 meses",
  platform: "Hotmart",
  guaranteeDays: 7,
  topics: [
    "Cuándo y cómo empezar la alimentación complementaria.",
    "Cantidades y frecuencias de las comidas.",
    "Un menú para las primeras 4 semanas.",
    "Recetas fáciles para el bebé y toda la familia.",
  ],
  source: "sitio-home",
  media: {
    photo: "bebe.scene.mama",
    photoTall: "bebe.scene.mama-vertical",
    device: "bebe.cutout.dispositivos",
    detail: "bebe.cutout.bol",
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
