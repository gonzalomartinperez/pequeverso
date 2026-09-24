# Hotmart purchase funnel — migration to pequeverso.com

Status as of 2026-09-13. The website side is implemented and verified; the Hotmart dashboard
still points at digitalproductsteam.com until the owner changes it (section 4). Nothing here
charges a card, changes live Hotmart settings or switches domains.

## 1. Page mapping (legacy → new)

| Funnel role | Legacy (WordPress) | New (pequeverso.com) | Compatibility |
|---|---|---|---|
| Main landing | `https://digitalproductsteam.com/pequeverso/grafismo-fonetico/` | `https://pequeverso.com/grafismo-fonetico/` | Old domain: `.htaccess` block in `docs/migration/old-domain.htaccess`. New domain also accepts the legacy paths `/pequeverso/…` and `/products/…` (301/308, query preserved). |
| Main checkout | `https://pay.hotmart.com/<offer>?checkoutMode=10` (value of `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO`) | same (unchanged; `NEXT_PUBLIC_CHECKOUT_URL`) | Every landing CTA (`header`, `hero`, `mid`, `final`, `sticky`) opens it in the same tab with allowlisted params appended. |
| Upsell | `…/pequeverso/imprime-y-juega/` | `https://pequeverso.com/imprime-y-juega/` | Same page; one `#hotmart-sales-funnel` widget inside `#gfp-decision` (legacy anchor id kept). |
| Downsell | `…/pequeverso/imprime-y-juega/?downsell=1` | `https://pequeverso.com/imprime-y-juega/?downsell=1` (alias `?offer=downsell`) | Query only changes the displayed variant; Hotmart decides and charges. |
| Thank-you | `…/pequeverso/grafismo-fonetico/gracias/` | `https://pequeverso.com/grafismo-fonetico/gracias/` | Neutral page: links to `consumer.hotmart.com`, never to files. |

Order bumps stay inside Hotmart's checkout (nothing on the site references them).

## 2. How the integration is adapted to Next.js

Hotmart's snippet is three inline tags; on the site it is `src/components/HotmartWidgetSlot`:

| Hotmart snippet | Site behaviour |
|---|---|
| `<div id="hotmart-sales-funnel"></div>` | Rendered exactly once per page, outside both offer views, inside `<section id="gfp-decision">` (reserved height, `tabindex="-1"` focus target, visible mode-aware kicker/title/copy). |
| `<script src="…/hotmart-checkout-elements.js">` | Loaded client-side with `next/script` (`afterInteractive`, id `hotmart-funnel`) — once per document, also across client navigations. |
| `checkoutElements.init('salesFunnel').mount('#hotmart-sales-funnel')` | Called only when the library is ready **and** the container exists; a module-level `WeakSet` of mounted containers plus a child-count check block duplicate mounts (StrictMode double effects, re-renders, back/forward). |
| Loading / failure | Skeleton + `aria-live` status while loading; after 8 s without any render, or on script error, a neutral notice ("Tu compra principal ya está confirmada… recarga") with a reload button. No success is ever implied, no fallback checkout link is offered. |
| Purchase-session context | The page never rewrites the URL or strips parameters; whatever Hotmart appends when it redirects the buyer stays in `location.search`. A direct visit without an active purchase may show Hotmart's "purchase in progress" message inside the container — expected. |
| Editorial CTAs | `a[data-decision-link]` (header, hero price block, mid-page, close, sticky bar) scroll to `#gfp-decision`, move focus into it and update the hash; they never link to a checkout. |
| Offer mode | `?downsell=1` / `?offer=downsell` set `data-offer` before first paint (inline script in `OfferModeRoot`); CSS shows the matching view and prices (US$14.99 / US$7.49 from `config/commerce.ts`). |
| Events | `ViewContent` once on mount (with the effective mode); **no** `CheckoutIntent`, `InitiateCheckout` or `Purchase` on post-purchase pages — viewing, scrolling to or focusing the widget emits nothing. Hotmart's pixel owns checkout and purchase events. |

Main landing: `CheckoutLink` forwards `utm_*`, `a`, `angle_key`, `ad_code`, `country`, `sck`, `src`,
`xcod`, `fbclid` from the landing URL and adds `sck=pv-gf-<position>`; `off`/`ref` are never
forwarded (a visitor-controlled `off` would select an arbitrary offer). One `CheckoutIntent` per
click, only on click.

## 3. Verified on the website (2026-09-12/13)

| Behaviour | How verified |
|---|---|
| Exactly one `#hotmart-sales-funnel` and one widget script on upsell and downsell | Playwright `offer-mode.spec.ts`, `smoke.ts` against production |
| Downsell variant applied before paint for `?downsell=1`, `?offer=downsell`, with UTMs | Playwright (attribute at DOMContentLoaded) |
| Canonical → base URL, `noindex` on upsell/downsell/thank-you | Playwright |
| Editorial CTAs focus `#gfp-decision`; no `pay.hotmart.com` links on post-purchase pages | Playwright |
| Widget script aborted / never renders → neutral fallback, no layout shift | Playwright (`widget.spec.ts`) |
| Main CTAs → `<offer>?checkoutMode=10` with allowlisted params; `off`/`ref` dropped; one `CheckoutIntent` per click | Playwright (`commerce.spec.ts`) |
| Thank-you: no `.pdf` links, no purchase markers, links to `consumer.hotmart.com` | Playwright |
| Legacy paths on the new domain redirect with query intact (`/pequeverso/imprime-y-juega/?downsell=1` → `/imprime-y-juega/?downsell=1`) | curl on the standalone server |
| Production: `?downsell=1` → 200, widget container present, `www`/slash canonicalization one hop | curl matrix, `docs/deployment.md` |

## 4. Pending — Hotmart dashboard changes (owner, not yet done)

Deploying the pages does **not** move the funnel. In the Hotmart producer area, for product
the principal offer (Grafismo Fonético, code in hPanel's `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO`):

| Setting | Current (documented) | Change to |
|---|---|---|
| Product → Sales page URL | `https://digitalproductsteam.com/pequeverso/grafismo-fonetico/` (older docs still show `/products/grafismo-fonetico/`) | `https://pequeverso.com/grafismo-fonetico/` |
| Sales Funnel → upsell step → page URL | `https://digitalproductsteam.com/pequeverso/imprime-y-juega/` | `https://pequeverso.com/imprime-y-juega/` |
| Sales Funnel → downsell step → page URL | `https://digitalproductsteam.com/pequeverso/imprime-y-juega/?downsell=1` | `https://pequeverso.com/imprime-y-juega/?downsell=1` |
| Post-sale → external thank-you URLs (approved / awaiting payment / under analysis) | `https://digitalproductsteam.com/pequeverso/grafismo-fonetico/gracias/` | `https://pequeverso.com/grafismo-fonetico/gracias/` |
| Sales Funnel → offers for the upsell (US$14.99) and downsell (US$7.49) steps | documented as "pendiente de configuración y prueba end-to-end" (product README 2026-08-04) | confirm they exist and are active; do not reuse legacy offer ids |
| Meta Pixel integration | Purchase (Web+API), Checkout page visits on | unchanged; "Hotmart product page visits" off (site owns ViewContent) |

Until these change, buyers who purchase from the new landing are sent by Hotmart to the **old**
upsell/downsell/thank-you URLs, which the old-domain `.htaccess` block redirects to the new pages
with the query intact (once that block is installed). Do the Hotmart change and the old-domain
redirect the same hour (`docs/migration.md`).

## 5. End-to-end verification checklist (needs a real purchase session)

Do this with a low-value test (Hotmart "test purchase" mode where available, or a real purchase
followed by a refund inside the guarantee) — **only with the owner's explicit approval**.

1. Open `https://pequeverso.com/grafismo-fonetico/?utm_source=e2e&utm_medium=test` → click a CTA
   → Hotmart checkout shows the principal product, USD price, and the URL carries `utm_*` and `sck=pv-gf-…`.
2. Complete the payment.
3. Hotmart redirects to the upsell: record the **exact URL and query** Hotmart used (expected
   `https://pequeverso.com/imprime-y-juega/` after the dashboard change). The widget renders Sí/No
   inside `#gfp-decision`; the page shows the upsell view (US$14.99).
4. Press **No** → Hotmart redirects to the downsell URL: record it (expected `…/imprime-y-juega/?downsell=1`);
   the page shows the downsell view (US$7.49) with the same single widget.
5. Press **No** again → Hotmart redirects to the thank-you page (expected `…/grafismo-fonetico/gracias/`):
   confirmation copy, links to `consumer.hotmart.com`, no file links.
6. Repeat 1–3 and press **Sí** on the upsell → Hotmart charges the upsell offer and continues to the
   thank-you page; check the Hotmart transaction list shows the upsell as a separate purchase.
7. Repeat 1–4 and press **Sí** on the downsell → same, with the downsell offer.
8. Open `…/imprime-y-juega/?downsell=1` directly with no purchase session → the page renders, the
   widget shows Hotmart's "purchase in progress"/session message or nothing, and the fallback notice
   appears only if nothing renders within 8 s. No charge is possible from the page itself.
9. Meta Events Manager: `ViewContent` from the site (connection methods Browser and Server,
   deduplicated, when `META_CAPI_ACCESS_TOKEN` is set), `InitiateCheckout` and `Purchase` from
   Hotmart only; no duplicated `Purchase`.
10. Refund the test purchases via `refund.hotmart.com` if real money was used.
11. Measure the rendered widget height in each mode at ≤ 768 px and ≥ 768 px and replace the estimated `--widget-min-h` (220 px / 180 px, set without a purchase session) in `src/features/commerce/HotmartWidgetSlot/HotmartWidgetSlot.module.css` with the measured values.

Record results in `docs/verification/` (date, URLs Hotmart used, screenshots of the widget in
each mode, transaction ids masked).

## 6. Boundaries

- No independent checkout links for upsell/downsell; no invented offer ids; Hotmart owns
  acceptance, rejection, progression and charging.
- A query parameter changes the displayed variant only; it never authorizes a discounted charge.
- The thank-you URL is not proof of payment; purchased PDFs are never in this repository.
- No `Purchase`/`CheckoutIntent` from viewing a page or reaching the widget.
- This document does not change live Hotmart settings or production domains; those actions
  require the owner's explicit approval and are listed in section 4 and `docs/migration.md`.
