import { getProduct, products } from "@config/products/index.ts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getImage } from "@/shared/media/media.ts";
import { buildMetadata } from "@/views/metadata.ts";
import { CoreLanding } from "@/views/product/core-landing-view.tsx";
import { OfferLanding } from "@/views/product/offer-landing-view.tsx";

type Props = { params: Promise<{ product: string }> };

export const dynamicParams = false;

export function generateStaticParams(): Array<{ product: string }> {
  return products.map((product) => ({ product: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).product);
  if (!product) return {};
  const image = getImage(product.media.og ?? product.media.hero);
  return buildMetadata({
    path: product.path,
    title: product.seo.title,
    description: product.seo.description,
    noindex: !product.seo.index,
    image: image.src,
    imageAlt: image.alt,
  });
}

/** One route per registry product; the template depends on the product kind. */
export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).product);
  if (!product) notFound();
  return product.kind === "core" ? <CoreLanding product={product} /> : <OfferLanding product={product} />;
}
