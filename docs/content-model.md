# Content model

Customer-facing copy is neutral Spanish, typed, and lives in `content/es/`. Business facts live in
`config/` (site-wide) and `src/products/<slug>.ts` (per product) and are imported by copy and
components — never retyped.

| File | Holds | Source of truth (read 2026-09-12) |
|---|---|---|
| `config/site.ts` | brand name, tagline, canonical URL, support email, social profiles, theme colour | brand foundations + `social-profiles.json` (private ops repo); env `NEXT_PUBLIC_SITE_URL` |
| `config/commerce.ts` | currency, guarantee (7 days), passthrough allowlist, Hotmart URLs | product README 2026-08-04, Hotmart docs |
| `src/products/grafismo-fonetico.ts` | price US$14.99, 9 PDF / 414 pp, 3-7 años, checkout env key + offer id + `sck` prefix, thank-you path, post-purchase offer, media ids, SEO title/description | product README 2026-08-04, Hotmart upload manifest 2026-07-24, live landing |
| `src/products/imprime-y-juega.ts` | upsell US$14.99 / downsell US$7.49, 6 PDF / 384 pp / 9 visible resources, parent product, media ids, SEO (noindex) | Hotmart upload manifest 2026-07-26, live post-purchase page |
| `content/es/products/index.ts` | shared shapes: `Resource`, `FaqItem`, `CoreLandingCopy`, `OfferLandingCopy` | — |
| `content/es/products/grafismo-fonetico/{copy,resources,faq}.ts` | landing copy, the 9 resources (names, page counts, descriptions), the 10 FAQ answers | published landing copy and `offer-content.mjs`, reviewed |
| `content/es/products/imprime-y-juega/{copy,resources,faq}.ts` | upsell/downsell copy, the 9 resources, the 9 FAQ answers | published post-purchase copy, reviewed |
| `content/es/home.ts` | homepage copy | new (grounded in brand foundations and the product brief) |
| `content/es/gracias.ts` | thank-you guidance (shared by every core product's `/<slug>/gracias/`) | published thank-you page, condensed |
| `content/es/legal/seller.ts` | seller identity — contains `[[PLACEHOLDERS]]` until supplied | **owner input required** (docs/legal-checklist.md) |

## Per-product folders

A product is a module in `src/products/` plus a folder in `content/es/products/<slug>/`:

- `copy.ts` — one typed object (`satisfies CoreLandingCopy` or `OfferLandingCopy`); section keys are
  what the templates in `src/features/landing` render. Counts that appear in copy ("9 PDF",
  "414 páginas") are prose and must match the module's `composition` (unit tests assert the facts).
- `resources.ts` — `Resource[]` with the real PDF names, page counts (`null` for embedded bonuses)
  and card media ids; the registry checks that pages sum to `composition.pageCount`.
- `faq.ts` — `readonly FaqItem[]`, imported by `copy.ts` as `faq.items`.

To add a product: create the folder, write `src/products/<slug>.ts` with `satisfies ProductInput`,
register it in `src/products/index.ts` and declare its media in `tools/media/sources.json`. Routes,
sitemap, footer, 404 and terms derive from the registry.

## Rules

- No testimonials, ratings, results, learning guarantees or "as seen in" claims. Content describes
  what the material contains and how it is used.
- Price anchors ("valor total US$99.99") are not shown: they were never a real prior price. The
  only strikethrough is the downsell's "Oferta anterior US$14.99", which is the price actually
  shown in the previous funnel step.
- The guarantee period is a single value (`guaranteeDays`) used by every page. Changing it is a
  business decision that must match the Hotmart product setting (EU sales require Hotmart's
  minimum; see docs/legal-checklist.md).
- Product names: public name "Grafismo Fonético"; the internal name "Trazos y Sonidos" never
  appears in customer copy (CI content invariant in `tests/unit`).
- Localization: one neutral-LATAM version (`lang="es"`). Voseo (AR) and peninsular (ES) variants
  from the WordPress era are not shipped in v1; they can return as build-time locale files.

## Adding or changing copy

1. Edit the typed object; keep keys stable (components import them).
2. If a fact changes (price, count, checkout), change `src/products/<slug>.ts`; the guarantee period
   lives in `config/commerce.ts`. Never retype facts in copy.
3. Run `npm run check` — unit tests assert the documented composition and prices.
4. Record business-facing changes in `CHANGELOG.md` and, if it is a decision, in `docs/decisions/`.
