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
| Serving | Hostinger website (LiteSpeed) serving `public_html` | Hostinger Node.js Web App (Hostinger forces `standalone`) |
| Redirects/headers | `out/.htaccess` generated from `config/edge-rules.json` | `redirects()`/`headers()` from the same file |
| Images | Build-time WebP derivatives (`tools/media`), `images.unoptimized` | same |
| Why default | No cold starts, CI artifact = deployed artifact, rollback by re-deploy, full `.htaccess` control | Only if `.htaccess` capabilities prove insufficient on the host |

Rules that keep both targets valid: no `proxy.ts`/middleware, no `cookies()`/`headers()`/request-time
APIs, no route handlers beyond `sitemap.ts`/`robots.ts`/metadata images, no runtime image optimizer.
ADR: `docs/decisions/ADR-0001-hosting-target.md`.

## Routes

| Route | Role | robots | canonical |
|---|---|---|---|
| `/` | Hub / homepage | index | self |
| `/grafismo-fonetico/` | Principal landing (checkout CTA) | index | self |
| `/imprime-y-juega/` | Upsell (Hotmart widget) | noindex | self |
| `/imprime-y-juega/?downsell=1` (alias `?offer=downsell`) | Same page, downsell mode | noindex | `/imprime-y-juega/` |
| `/grafismo-fonetico/gracias/` | Post-purchase guidance | noindex | self |
| `/aviso-legal/`, `/privacidad/`, `/cookies/`, `/terminos/`, `/compras-y-reembolsos/` | Legal | noindex,follow | self |
| `/soporte/` | Support and contact | index | self |
| anything else | Real 404 (`out/404.html`, `ErrorDocument 404`) | — | — |

All routes are trailing-slash canonical (`trailingSlash: true`; the server redirects the non-slash
form). `www` → apex and `http` → `https` are handled in `.htaccess` in one hop.

## Offer mode (`?downsell=1`)

Both the upsell and the downsell views are rendered into the static HTML of `/imprime-y-juega/`.
A classic inline script — the first child of `<main id="offer-root" suppressHydrationWarning>` —
reads `location.search` before the sibling views are parsed and sets `data-offer="downsell" |
"upsell"` on that element. Global CSS hides the inactive view (`.only-upsell` / `.only-downsell`),
so there is no flash, no layout shift and no redirect hop. After hydration a client island reads
`useSearchParams()` (inside `<Suspense>`) to mirror the mode for event parameters and `aria-hidden`.
Exactly one `#hotmart-sales-funnel` container exists on the page, outside both views. The Hotmart
widget itself is identical in both modes: Hotmart decides the offer from the buyer's funnel session.

## Commerce and tracking boundaries

- `config/commerce.ts` holds prices, composition, guarantee and passthrough allowlist. `lib/params.ts`
  builds checkout URLs (never forwards `off`/`ref`).
- `lib/tracking.ts` + `components/Analytics` own site events (PageView, ViewContent,
  PequeversoProductInterest, CheckoutIntent) with UUID event IDs, gated by `lib/consent.ts`.
  Hotmart owns InitiateCheckout and Purchase. See `docs/tracking.md`.

## Deployment and verification

`scripts/build-info.mjs` writes `public/build-info.json` (`sha`, `ref`, `builtAt`) served with
`Cache-Control: no-store`; the deploy workflow compares it with the commit it built and runs
`scripts/smoke.mjs` before declaring success. See `docs/deployment.md`.
