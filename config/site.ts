/**
 * Site-wide constants. Deployment-specific values (origin, checkout, pixel) come only from
 * NEXT_PUBLIC_* variables inlined at build time and validated by scripts/check-env.ts — the
 * repository ships no inline defaults for them. Everything else is a documented business fact
 * (see docs/content-model.md for sources and dates).
 */
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

export const site = {
  name: "Pequeverso",
  url: rawSiteUrl,
  locale: "es",
  ogLocale: "es_LA",
  tagline: "Un pequeño universo para aprender, crear y crecer en familia.",
  description:
    "Recursos imprimibles para acompañar los primeros pasos hacia la lectura de niños de 3 a 7 años: letras, sonidos, sílabas, palabras y trazos, listos para imprimir en casa.",
  supportEmail: "somospequeverso@gmail.com",
  themeColor: "#003068",
  social: {
    instagram: "https://www.instagram.com/somospequeverso/",
    facebook: "https://www.facebook.com/somospequeverso/",
    tiktok: "https://www.tiktok.com/@somospequeverso",
    youtube: "https://www.youtube.com/@somospequeverso",
  },
} as const;

export type SocialNetwork = keyof typeof site.social;

/** Absolute URL for a site path (paths are always trailing-slash canonical). */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${normalized}`;
}
