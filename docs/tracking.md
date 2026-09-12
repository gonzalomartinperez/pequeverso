# Tracking and consent

Replaces the WordPress PixelYourSite setup with a first-party, consent-gated implementation.
Hotmart remains the source of truth for purchases.

## Event ownership

| Event | Owner | Trigger | Parameters | Dedup | Consent |
|---|---|---|---|---|---|
| `PageView` | site (browser) | first load + every client navigation (once per path) | — | single source | marketing |
| `ViewContent` | site | product landing mount; upsell/downsell mount (name suffixed with the mode) | `content_ids`, `content_name`, `content_type: product`, `value`, `currency: USD` | UUID `eventID` | marketing |
| `PequeversoProductInterest` (custom) | site | hub → product link click | `product`, `cta_position`, `destination` | UUID | marketing |
| `CheckoutIntent` (custom) | site | principal CTA click | `product`, `offer`, `cta_position`, `offer_mode` | UUID | marketing |
| `InitiateCheckout`, `Purchase` (+ `Payment Generated`) | **Hotmart** (Web + API) | checkout load / payment approved | Hotmart | inside Hotmart | Hotmart |
| `PageScroll`, `TimeOnPage`, `Download`, `Form` | nobody | dropped (PixelYourSite automatics) | — | — | — |

The site never fires `InitiateCheckout` or `Purchase` (unit + E2E tests assert the markers are
absent). Every event is mirrored to `window.dataLayer` with `event_id` for debugging.

## Implementation

- `src/lib/tracking.ts`: `track(name, params)` → UUID event id → `dataLayer` → `fbq('track'|'trackCustom', name, params, { eventID })` only when the pixel is configured **and** marketing consent is granted. Events raised before consent are queued and flushed after "Aceptar"; "Rechazar" drops the queue.
- `src/components/Analytics/Analytics.tsx`: loads `connect.facebook.net/en_US/fbevents.js` through `next/script` after consent, runs `fbq('init', ID)`, fires PageView on route changes. Optional cookie-less Umami loads without consent.
- `src/lib/consent.ts`: versioned first-party store (`localStorage` + `pv_consent` cookie, 6 months). `ConsentBanner` shows only when a consent-gated integration is configured; the footer "Configurar cookies" reopens it.
- Environment: `NEXT_PUBLIC_META_PIXEL_ID` (empty → no script, no banner), `NEXT_PUBLIC_UMAMI_SCRIPT_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (optional), `NEXT_PUBLIC_TRACKING_DEBUG=1` (console).

## Attribution across domains

`CheckoutLink` forwards `utm_*`, `a`, `angle_key`, `ad_code`, `country`, `sck`, `src`, `xcod`
and `fbclid` from the landing URL to the Hotmart checkout and adds `sck=pv-gf-<position>` (≤ 30
chars). `off` and `ref` are never forwarded (a visitor-controlled `off` selects an arbitrary
offer). Hotmart's pixel then attributes `InitiateCheckout`/`Purchase`.

## Hotmart configuration (owner, producer area)

Meta Pixel integration: "Sales made" = Purchase (Web + API, differentiate immediate vs
non-immediate = yes, value = transaction), "Checkout page visits" = on, "Hotmart product page
visits" = off (the site owns ViewContent). If Events Manager reports non-deduplicated server
Purchases, switch Purchase to API-only inside Hotmart.

## Consent rationale

Spain is a target market (AEPD 2024 cookie criteria, LSSI 22.2), Meta's Business Tools terms
require consent where the law requires it, and Chile's Ley 21.719 applies from 2026-12-01. The
banner is geo-blind with equal Aceptar/Rechazar; rejecting never limits the site or the purchase.
Expected cost: a share of visitors reject, so site-side events under-count; Hotmart's checkout
events remain complete.
