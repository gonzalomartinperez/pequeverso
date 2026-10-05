"use client";
import { formatDay } from "@content/es/assistant";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";
import type { Price, Product, Resource } from "../domain/models";
import { usePresentation } from "./context";
import { labelClass, SafeLink } from "./parts";

/**
 * A price appears only when the API sends `price` (it withholds prices it cannot confirm as
 * current), always with its tax and local-currency notes and the date it was confirmed. The
 * contract has no stock, rating, discount or urgency field, so none is ever shown.
 */
function PriceLine({ price }: { price: Price | null }) {
  const { t } = usePresentation();
  if (!price) return <p className="text-small text-subtle">{t.priceUnverified}</p>;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-lead font-bold text-primary tabular-nums">{price.display}</span>
        <span className="text-tiny text-subtle">{price.taxNote}</span>
      </p>
      <p className="text-tiny text-subtle">{price.note}</p>
      <p className="text-tiny text-subtle">{t.priceVerified(formatDay(price.verifiedAt))}</p>
    </div>
  );
}

function Thumb({ product }: { product: Product }) {
  if (!product.image)
    return (
      <div
        aria-hidden="true"
        className="grid aspect-[4/3] w-full place-items-center bg-mint text-icon cq-md:w-40"
      >
        <BookOpen className="size-7" />
      </div>
    );
  return (
    <img
      src={product.image.url}
      alt={product.image.alt}
      width={product.image.width}
      height={product.image.height}
      loading="lazy"
      decoding="async"
      className="aspect-[4/3] w-full bg-mint object-cover cq-md:aspect-auto cq-md:w-40 cq-md:shrink-0"
    />
  );
}

function ProductCard({ product, resources }: { product: Product; resources: Resource[] }) {
  const { t } = usePresentation();
  const headingId = `assistant-product-${product.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="cq overflow-hidden rounded-lg border border-line bg-card shadow-sm"
    >
      <div className="flex flex-col cq-md:flex-row">
        <Thumb product={product} />
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <h3 id={headingId} className="font-display text-h3 font-bold text-heading">
              {product.name}
            </h3>
            <p className="flex flex-wrap gap-1.5 text-tiny font-bold">
              <span className="rounded-pill bg-mint px-2.5 py-1 text-teal-text">{product.ageRange}</span>
              {resources.length > 0 && (
                <span className="rounded-pill bg-sky px-2.5 py-1 text-navy">
                  {t.resourceCount(resources.length)}
                </span>
              )}
            </p>
          </div>
          <p className="line-clamp-3 text-small text-body">{product.summary}</p>
          <PriceLine price={product.price} />
          <div className="flex flex-wrap gap-2">
            <SafeLink href={product.url} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t.viewProduct}
            </SafeLink>
            <SafeLink
              href={product.purchaseUrl}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {t.purchaseOptions}
            </SafeLink>
          </div>
        </div>
      </div>
    </article>
  );
}

function ResourceList({ resources }: { resources: Resource[] }) {
  const { t } = usePresentation();
  if (!resources.length) return null;
  return (
    <section aria-label={t.resourcesLabel} className="flex flex-col gap-2">
      <h3 className={labelClass}>{t.resourcesLabel}</h3>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line bg-card">
        {resources.map((resource) => (
          <li key={resource.id} className="flex items-start gap-3 p-3">
            {resource.image ? (
              <img
                src={resource.image.url}
                alt=""
                width={56}
                height={42}
                loading="lazy"
                decoding="async"
                className="h-[42px] w-14 shrink-0 rounded-chip bg-mint object-cover"
              />
            ) : (
              <BookOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-icon" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-heading">{resource.title}</p>
              <p className="text-small text-subtle">
                {resource.pages ? `${t.pages(resource.pages)} · ` : ""}
                {resource.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Comparison({ products, resources }: { products: Product[]; resources: Resource[] }) {
  const { t } = usePresentation();
  const rows: { label: string; cell: (product: Product) => string }[] = [
    { label: t.ageRange, cell: (product) => product.ageRange },
    { label: t.price, cell: (product) => product.price?.display ?? t.priceUnverified },
    {
      label: t.resourcesLabel,
      cell: (product) => {
        const count = resources.filter((resource) => resource.productId === product.id).length;
        return count ? t.resourceCount(count) : "—";
      },
    },
  ];
  return (
    <section
      aria-label={t.compareLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a horizontally scrollable region must be keyboard-scrollable (WCAG 2.1.1)
      tabIndex={0}
      className="overflow-x-auto rounded-md border border-line"
    >
      <table className="w-full min-w-[20rem] border-collapse bg-card text-small">
        <caption className="sr-only">{t.compareLabel}</caption>
        <thead className="bg-sky">
          <tr>
            <td />
            {products.map((product) => (
              <th key={product.id} scope="col" className="px-3 py-2 text-left font-extrabold text-heading">
                {product.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-line">
              <th scope="row" className="px-3 py-2 text-left font-bold text-subtle">
                {row.label}
              </th>
              {products.map((product) => (
                <td key={product.id} className="px-3 py-2 text-body">
                  {row.cell(product)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ProductSection({ products, resources }: { products: Product[]; resources: Resource[] }) {
  const { t } = usePresentation();
  if (!products.length) return <ResourceList resources={resources} />;
  const loose = resources.filter(
    (resource) => !products.some((product) => product.id === resource.productId),
  );
  return (
    <section aria-label={t.productsLabel} className="flex flex-col gap-3">
      {products.length > 1 && <Comparison products={products} resources={resources} />}
      <ul className={cx("grid gap-3", products.length > 1 && "cq-lg:grid-cols-2")}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              resources={resources.filter((resource) => resource.productId === product.id)}
            />
          </li>
        ))}
      </ul>
      <ResourceList resources={products.length === 1 ? resources : loose} />
    </section>
  );
}
