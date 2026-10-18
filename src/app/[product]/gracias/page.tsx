import { coreProducts, getProduct } from "@config/products/index.ts";
import { graciasCopy } from "@content/es/gracias";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/views/metadata.ts";
import { ThanksPage } from "@/views/product/thanks-view.tsx";

type Props = { params: Promise<{ product: string }> };

export const dynamicParams = false;

export function generateStaticParams(): Array<{ product: string }> {
  return coreProducts().map((product) => ({ product: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).product);
  if (product?.kind !== "core") return {};
  return buildMetadata({
    path: product.funnel.thanksPath,
    title: graciasCopy.meta.title,
    description: graciasCopy.meta.description,
    noindex: true,
  });
}

/** Thank-you page of a core product (Hotmart external thank-you URL). */
export default async function ProductThanksPage({ params }: Props) {
  const product = getProduct((await params).product);
  if (product?.kind !== "core") notFound();
  return <ThanksPage product={product} />;
}
