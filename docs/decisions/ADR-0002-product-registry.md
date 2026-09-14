# ADR-0002: Product registry with per-product routes

Date: 2026-09-13 · Status: accepted

## Context

v1 hard-coded the two products across the tree: prices and composition in `config/commerce.ts`,
copy in three flat content files, one App Router folder per product, and product references
(checkout fallback, offer id, `sck` prefix, footer links, sitemap priorities, 404 links, terms
facts, breadcrumb) spread over a dozen files. Adding a product or changing a fact meant touching
all of them, and nothing verified that media ids, resource page counts and funnel links agreed.

## Decision

- One registry, `src/products/`: a Zod v4 schema (`schema.ts`, discriminated on `kind`:
  `core` | `post-purchase-offer`), one module per product declared with `satisfies ProductInput`,
  parsed once at build time in `index.ts`. Refinements: every media id exists in the manifest,
  unique slugs/codes, `parent`/`postPurchaseOffer` resolve to the right kind, `thanksPath` is
  `/<slug>/gracias/`, resource pages sum to `composition.pageCount`.
- Routes come from the registry: `src/app/[product]/page.tsx` (`dynamicParams = false`,
  `generateStaticParams`) renders `CoreLanding` or `OfferLanding`; `[product]/gracias/` renders
  `ThanksPage` for core products. The public URLs are unchanged.
- Templates live in `src/features/landing` and take a `product`; client islands receive plain
  props (`CheckoutLink` gets `{ slug, checkoutUrl, offer, sckPrefix, fallbackPath }`), so Zod and
  the media manifest never reach client bundles.
- Copy moves to `content/es/products/<slug>/{copy,resources,faq}.ts`; `config/commerce.ts` keeps
  only shared facts (currency, guarantee, passthrough allowlist, Hotmart URLs, `formatUsd`).
- The checkout URL is read as the literal `process.env.NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO ||
  process.env.NEXT_PUBLIC_CHECKOUT_URL || ""` so Next can inline it; a per-product variable can be
  introduced without code changes.
- Structured data: `Product` with one `Offer` (price, USD, InStock, canonical URL) for indexable
  core products, plus `BreadcrumbList`. No merchant-listing fields, ratings or reviews.

## Consequences

- Adding a product = one content folder + one module + media entries; routes, sitemap, footer,
  404 and terms follow. Wrong ids or counts fail `npm run build` and `npm test`.
- `content/es/gracias.ts` is shared by every core product's thank-you page; a second core product
  would need product-specific thank-you copy (candidate: `copy.thanks` in the core copy type).
- `sck` values keep the `pv-gf-<position>` format (prefix from `checkout.sckPrefix`).
- The Hotmart rules are unchanged: one widget container in `#gfp-decision`, no direct
  upsell/downsell links, no `InitiateCheckout`/`Purchase` from the site.
- Both templates share the `[product]` route chunk, so each landing ships the other's client
  islands (~2 KB gzip); split the route if a third template makes that noticeable.
- Media budget is enforced per group (folder under `public/media`, 9 MB) and in total (30 MB).
