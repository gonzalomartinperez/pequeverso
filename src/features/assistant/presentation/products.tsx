"use client";
import { formatDay } from "@content/es/assistant";
import { BookOpen } from "lucide-react";
import { useId } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";
import type { Price, Product, Resource } from "../domain/models";
import styles from "./assistant.module.css";
import { usePresentation } from "./context";
import { AffiliateLink, labelClass, SafeLink } from "./parts";

/**
 * A price appears only when the API supplies a dated public-catalog reference, with its tax and
 * local-currency notes. The legacy `verifiedAt` field dates the catalog export, not a live merchant
 * confirmation; Hotmart establishes the final total. The
 * contract has no stock, rating, discount or urgency field, so none is ever shown.
 */
function PriceLine({ price }: { price: Price | null }) {
  const { t, locale } = usePresentation();
  if (!price) return <p className="text-small text-subtle">{t.priceUnverified}</p>;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-lead font-bold text-primary tabular-nums">{price.display}</span>
        <span className="text-tiny text-subtle">{price.taxNote}</span>
      </p>
      <p className="text-tiny text-subtle">{price.note}</p>
      <p className="text-tiny text-subtle">{t.priceReferenceDate(formatDay(price.verifiedAt, locale))}</p>
    </div>
  );
}

function Thumb({ product }: { product: Product }) {
  if (!product.image)
    return (
      <div
        aria-hidden="true"
        className={cx(styles.productThumb, "grid place-items-center rounded-md bg-mint text-icon")}
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
      className={cx(styles.productThumb, "rounded-md bg-mint")}
    />
  );
}

function ProductCard({ product, resources }: { product: Product; resources: Resource[] }) {
  const { t } = usePresentation();
  const affiliate = product.kind === "affiliate";
  const disclosure = product.disclosure ?? t.affiliateDisclosure;
  // The canonical summary includes disclosure for older clients. Display its exact trailing
  // copy only once here, next to the affiliate action; persisted API content remains intact.
  const summary =
    affiliate && product.summary.endsWith(disclosure)
      ? product.summary.slice(0, -disclosure.length).trim()
      : product.summary;
  // The same product can appear in several answers: ids must be unique per rendered card.
  const headingId = useId();
  return (
    <article aria-labelledby={headingId} className="cq rounded-lg border border-line bg-card p-3">
      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 items-start gap-3">
          <Thumb product={product} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 id={headingId} className={cx(styles.productTitle, "font-sans font-bold text-heading")}>
              {product.name}
            </h3>
            <p className="flex flex-wrap gap-1.5 text-tiny font-bold">
              <span className="rounded-pill bg-mint px-2.5 py-1 text-teal-text">{product.ageRange}</span>
              {affiliate && (
                <span className="rounded-pill bg-sky px-2.5 py-1 text-navy">{t.affiliateLabel}</span>
              )}
              {resources.length > 0 && (
                <span className="rounded-pill bg-sky px-2.5 py-1 text-navy">
                  {t.resourceCount(resources.length)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2.5">
          {summary && <p className="text-small text-body">{summary}</p>}
          {product.format && <p className="text-small text-subtle">{product.format}</p>}
          {affiliate && !product.price ? (
            <p className="text-small text-subtle">{t.affiliatePrice}</p>
          ) : (
            <PriceLine price={product.price} />
          )}
          <div className="flex flex-wrap gap-2">
            <SafeLink
              href={product.url}
              className={cx(buttonVariants({ variant: "outline", size: "sm" }), styles.productAction)}
            >
              {affiliate ? t.affiliateInfo : t.viewProduct}
            </SafeLink>
            {affiliate ? (
              <AffiliateLink
                href={product.purchaseUrl}
                className={cx(buttonVariants({ variant: "secondary", size: "sm" }), styles.productAction)}
              >
                {t.affiliateAction}
              </AffiliateLink>
            ) : (
              <SafeLink
                href={product.purchaseUrl}
                className={cx(buttonVariants({ variant: "primary", size: "sm" }), styles.productAction)}
              >
                {t.purchaseOptions}
              </SafeLink>
            )}
          </div>
          {affiliate && <p className="text-tiny text-subtle">{disclosure}</p>}
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
      <p className="text-tiny text-subtle">{t.resourcesHint}</p>
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
  const { t, locale } = usePresentation();
  const rows: { label: string; cell: (product: Product) => string }[] = [
    { label: t.ageRange, cell: (product) => product.ageRange },
    { label: t.format, cell: (product) => product.format ?? t.formatUnknown },
    {
      label: t.productRelationship,
      cell: (product) => (product.kind === "affiliate" ? t.affiliateLabel : t.ownProduct),
    },
    {
      label: t.price,
      // Catalog reference prices retain their notes and export date; no merchant confirmation.
      cell: (product) =>
        product.price
          ? `${product.price.display} ${product.price.taxNote}. ${product.price.note} ${t.priceReferenceDate(formatDay(product.price.verifiedAt, locale))}`
          : product.kind === "affiliate"
            ? t.affiliatePrice
            : t.priceUnverified,
    },
    {
      label: t.resourcesLabel,
      cell: (product) => {
        const count = resources.filter((resource) => resource.productId === product.id).length;
        return count ? t.resourceCount(count) : product.kind === "affiliate" ? t.affiliateResources : "—";
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
      <table className="w-full min-w-[36rem] table-fixed border-collapse bg-card text-small">
        <caption className="sr-only">{t.compareLabel}</caption>
        <thead className="bg-sky">
          <tr>
            <td className="w-32" />
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
