import { absoluteUrl, site } from "@config/site";
import type { Metadata } from "next";

export type PageMeta = {
  /** Trailing-slash path, e.g. "/grafismo-fonetico/". */
  path: string;
  title: string;
  description: string;
  /** Post-purchase and legal pages are excluded from the index. */
  noindex?: boolean;
  /** Path of an OG image under public/, defaults to the brand card. */
  image?: string;
  imageAlt?: string;
};

export const defaultOgImage = { path: "/media/brand/pequeverso-og-1200x630.png", alt: "Pequeverso" };

/** Builds canonical, robots, Open Graph and Twitter metadata for a route. */
export function buildMetadata(meta: PageMeta): Metadata {
  const canonical = absoluteUrl(meta.path);
  const image = absoluteUrl(meta.image ?? defaultOgImage.path);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    robots: meta.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: site.ogLocale,
      siteName: site.name,
      url: canonical,
      title: meta.title,
      description: meta.description,
      images: [{ url: image, width: 1200, height: 630, alt: meta.imageAlt ?? defaultOgImage.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [image],
    },
  };
}
