# Architecture

## Shape

pequeverso.com is a small commercial site: a homepage (hub), the principal product landing, an
optional post-purchase offer page with a query-driven downsell mode, a thank-you page, legal and
support pages, and a real 404. There is no database, CMS, authentication or API: payments,
delivery and refunds run on Hotmart.

```
visitor ──► pequeverso.com (static HTML/CSS, small client islands)
              │  principal CTA (allowlisted params)            Hotmart checkout (pay.hotmart.com)
              │  post-purchase pages embed the Hotmart          Hotmart sales-funnel widget decides
              │  sales-funnel widget (Sí / No)                  upsell / downsell server-side
              └─ /grafismo-fonetico/gracias/ links to           consumer.hotmart.com (delivery)
```

## Build targets

| | Static export (default) | Node standalone (fallback) |
|---|---|---|
| Config | `NEXT_OUTPUT=export` (default) | `NEXT_OUTPUT=standalone` |
| Serving | Hostinger website (LiteSpeed) serving `public_html`, pulled from the `deploy` branch by Hostinger Git | Hostinger Node.js Web App building `release`/`main` (forces `standalone`; auto-detected by `/hbuilds/`) |
| Redirects/headers | `out/.htaccess` generated from `config/edge-rules.json` | `redirects()`/`headers()` from the same file |
| Images | Build-time WebP derivatives (`tools/media`), `images.unoptimized` | same |
| Status | Supported (Deploy workflow publishes `deploy`) | **Connected in hPanel by the owner** (Deploy workflow promotes `release`) |

Rules that keep both targets valid: no `proxy.ts`/middleware, no `cookies()`/`headers()`/request-time
APIs, no route handlers beyond `sitemap.ts`/`robots.ts`/metadata images, no runtime image optimizer.
ADR: `docs/decisions/ADR-0001-hosting-target.md`.

## Source tree

```
config/          site-wide facts: site.ts (brand, URLs), commerce.ts (currency, guarantee, passthrough
                 allowlist, Hotmart URLs), edge-rules.json, budgets.json
content/es/      neutral-Spanish copy: home.ts, gracias.ts, legal/, products/<slug>/{copy,resources,faq}.ts
src/products/    the product registry (schema.ts, <slug>.ts modules, index.ts, jsonld.ts)
src/app/         routes: page.tsx (hub), [product]/ (one landing per registry product),
                 [product]/gracias/ (thank-you of core products), legal/support pages, sitemap, robots
src/features/    landing/ (CoreLanding, OfferLanding, ThanksPage templates), commerce/ (client islands),
                 gallery/, tracking/
src/components/  layout (PageShell, Header, Footer, LegalLayout) and ui primitives
src/lib/         media.ts (manifest access), metadata.ts
media/, public/  media manifest and build-time renditions (tools/media)
```

## Product registry

`src/products` is the single source of product facts. Each product is a module
(`src/products/grafismo-fonetico.ts`, `src/products/imprime-y-juega.ts`) declared with
`satisfies ProductInput` and parsed once, at build time, by `src/products/index.ts` through the Zod
schema in `src/products/schema.ts` (discriminated union on `kind`):

| Field | `core` (principal product) | `post-purchase-offer` |
|---|---|---|
| identity | `slug` (route), `code` (media namespace), `name`, `shortName`, `checkoutTitle?` | same |
| `composition` | `pdfCount`, `pageCount`, `ageRange`, `visibleResources?` | same |
| `media` | `hero`, `og?`, `pageIds[]`, `videoIds[]`, `cards[]`, `scenes {problem, credibility}` | `hero`, `og?`, `pageIds[]`, `videoIds[]`, `cards[]` |
| `seo` | `index`, `title`, `description`, `priority` | same (`index: false`) |
| `resources`, `copy` | the real PDFs and the typed landing copy from `content/es/products/<slug>/` | same |
| `pricing` | `{ list }` | `{ upsell, downsell }` |
| `checkout` | `envKey`, `url` (static `process.env` reference), `offer`, `sckPrefix` (<= 6 chars) | — (never a direct checkout) |
| `funnel` / `parent` | `thanksPath`, `postPurchaseOffer?` | `parent` (a core slug), `decision: "hotmart-widget"` |

Every media id is refined with `hasMedia()` (unknown ids fail the build); the registry as a whole
checks unique slugs/codes, that `parent`/`postPurchaseOffer` resolve to the right kind, that
`thanksPath` is `/<slug>/gracias/` and that resource page counts sum to `composition.pageCount`.
API: `products`, `getProduct(slug)`, `coreProducts()`, `offerProducts()`, `indexableProducts()`,
`featuredProduct()` (the hub's product), `checkoutFallbackPath(product)`. Zod and the media manifest
stay on the server: client islands (`CheckoutLink`, `ProductInterestLink`, `OfferModeMirror`) receive
plain props from the templates. `src/products/jsonld.ts` emits a `Product` + single `Offer` (and a
`BreadcrumbList`) for indexable core products only — never ratings, reviews or merchant-listing fields.
ADR: `docs/decisions/ADR-0002-product-registry.md`.

## Routes

`src/app/[product]/page.tsx` (`dynamicParams = false`, `generateStaticParams` from the registry)
renders `CoreLanding` or `OfferLanding` by kind; `src/app/[product]/gracias/page.tsx` renders
`ThanksPage` for core products. Adding a product module therefore adds its routes, sitemap entry,
footer/404 links and terms paragraph without touching the app tree.

| Route | Role | robots | canonical |
|---|---|---|---|
| `/` | Hub / homepage (`featuredProduct()`) | index | self |
| `/grafismo-fonetico/` | Principal landing (checkout CTA), `[product]` core | index | self |
| `/imprime-y-juega/` | Upsell (Hotmart widget), `[product]` offer | noindex | self |
| `/imprime-y-juega/?downsell=1` (alias `?offer=downsell`) | Same page, downsell mode | noindex | `/imprime-y-juega/` |
| `/grafismo-fonetico/gracias/` | Post-purchase guidance, `[product]/gracias` | noindex | self |
| `/aviso-legal/`, `/privacidad/`, `/cookies/`, `/terminos/`, `/compras-y-reembolsos/` | Legal | noindex,follow | self |
| `/soporte/` | Support and contact | index | self |
| anything else | Real 404 (`out/404.html`, `ErrorDocument 404`) | — | — |

All routes are trailing-slash canonical (`trailingSlash: true`; the server redirects the non-slash
form). `www` → apex and `http` → `https` are handled in `.htaccess` in one hop.

## Offer mode (`?downsell=1`)

Both the upsell and the downsell views are rendered into the static HTML of `/imprime-y-juega/`.
A classic inline script — the first child of `<main id="contenido" data-offer-root suppressHydrationWarning>` —
reads `location.search` before the sibling views are parsed and sets `data-offer="downsell" |
"upsell"` on that element. Global CSS hides the inactive view (`.only-upsell` / `.only-downsell`),
so there is no flash, no layout shift and no redirect hop. After hydration a client island reads
`useSearchParams()` (inside `<Suspense>`) to mirror the mode for event parameters and `aria-hidden`.
Exactly one `#hotmart-sales-funnel` container exists on the page, outside both views. The Hotmart
widget itself is identical in both modes: Hotmart decides the offer from the buyer's funnel session.

## Commerce and tracking boundaries

- `src/products` holds prices, composition, checkout and funnel facts per product; `config/commerce.ts`
  keeps the shared ones (currency, guarantee, passthrough allowlist, Hotmart URLs).
  `features/commerce/checkout-url.ts` builds checkout URLs (never forwards `off`/`ref`) and the
  per-product `sck=pv-<sckPrefix>-<position>`.
- `lib/tracking.ts` + `components/Analytics` own site events (PageView, ViewContent,
  PequeversoProductInterest, CheckoutIntent) with UUID event IDs, gated by `lib/consent.ts`.
  Hotmart owns InitiateCheckout and Purchase. See `docs/tracking.md`.

## Deployment and verification

`scripts/build-info.mjs` writes `public/build-info.json` (`sha`, `ref`, `builtAt`) served with
`Cache-Control: no-store`; the deploy workflow compares it with the commit it built and runs
`scripts/smoke.mjs` before declaring success. See `docs/deployment.md`.
