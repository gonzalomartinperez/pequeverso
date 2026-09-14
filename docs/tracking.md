# Tracking and consent

First-party, consent-gated tracking (`src/features/tracking/`). Hotmart remains the source of
truth for checkout and purchases; the site only measures interest.

## Adapters

| Adapter (`id`) | Variable(s) | Category | Loads | Needs consent |
|---|---|---|---|---|
| Meta Pixel (`meta`) | `NEXT_PUBLIC_META_PIXEL_ID` | `marketing` | `strict`: after the marketing grant. `advanced`: immediately with `fbq('consent','revoke')`, `grant` after "Aceptar" | yes |
| Umami (`umami`) | `NEXT_PUBLIC_UMAMI_SCRIPT_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | `none` | `lazyOnload`, no cookies, no personal data | no |

An adapter is `enabled` only when its variables are set at build time. With none enabled the
module is inert: no scripts, no banner, `window.dataLayer` still mirrors events for debugging.

## Event mapping

| Event | Trigger | Parameters | Meta | Umami |
|---|---|---|---|---|
| `PageView` | first load + every client navigation (once per path) | — | `fbq('track')` | auto-tracked by the script (site event skipped) |
| `ViewContent` | product landing mount; upsell/downsell mount (`content_name` suffixed with the mode) | `content_ids`, `content_name`, `content_type: product`, `value`, `currency` | `fbq('track')` | `umami.track` |
| `PequeversoProductInterest` | hub → product link click | `product`, `cta_position`, `destination` | `fbq('trackCustom')` | `umami.track` |
| `CheckoutIntent` | principal CTA click | `product`, `offer`, `cta_position`, `offer_mode` | `fbq('trackCustom')` | `umami.track` |

Every event gets a UUID `eventId` (`crypto.randomUUID`), is pushed to `window.dataLayer` as
`{ event, event_id, ...params }`, and reaches Meta as `{ eventID }` so Hotmart's server-side
events deduplicate. Typed helpers: `trackPageView`, `trackViewContent`, `trackProductInterest`,
`trackCheckoutIntent`; `isTrackingConfigured()` is true when at least one adapter is enabled.

## Forbidden events

`InitiateCheckout`, `Purchase`, `PlaceAnOrder` and `begin_checkout` belong to Hotmart (Web +
API). `FORBIDDEN_EVENTS` in `track.ts` excludes them from the `EventName` union; a runtime guard
throws in development and no-ops in production. Unit and E2E tests assert they never appear in
`dataLayer` or in `fbq` calls, including after a checkout CTA click.

## Consent

Categories: `necessary` (implicit), `analytics`, `marketing`. Store: `localStorage.pv_consent`
(`{ version: 2, analytics, marketing, updatedAt }`) plus cookie `pv_consent=a<0|1>m<0|1>.v2`
(6 months) for a future server-side check. `CONSENT_VERSION = 2`; bumping it re-prompts every
visitor. Changes are broadcast on `window` as `pv:consent`.

`ConsentBanner` renders only when an enabled adapter has a gated category. Actions: **Aceptar**
(grant every gated category), **Rechazar** (deny all), **Configurar** (one checkbox per gated
category, naming the enabled tools, then "Guardar selección"). The footer `CookieSettingsLink`
reopens it (`pv:consent:open`) with the stored selection.

Queueing: an event raised before a decision is queued per adapter and flushed on grant; once
a decision exists, events for a denied category are dropped, never replayed. Events raised
while a granted adapter's script is still loading stay queued until `syncConsent()` runs on
script load.

### Modes (`NEXT_PUBLIC_CONSENT_MODE`)

| Mode | Gated scripts | Meta consent API |
|---|---|---|
| `strict` (default) | injected only after their category is granted; nothing third-party loads before | `init` on grant; `revoke` if the visitor later withdraws |
| `advanced` | Meta loads at hydration | bootstrap calls `fbq('consent','revoke')` before `init`; `grant` on "Aceptar" |

Use `advanced` only if the legal review accepts a pre-consent script load (Meta sets no
cookies while revoked). The AEPD-oriented default is `strict`.

## Adding an adapter (TikTok, gtag, ...)

1. Add the id to `AdapterId` and a factory `createXAdapter(config)` in `adapters/x.ts` returning
   `TrackingAdapter` (`enabled` false when its variable is empty; `label` used in the banner).
2. `scripts(mode)` returns the vendor stub and loader as `ScriptSpec`s; in `advanced` mode the stub
   starts with the vendor's revoke call. `onConsent(state)` grants or revokes.
3. `send(event)` maps standard names to the vendor's standard events, passes `eventId` as the
   vendor's dedup id and returns `false` while the vendor global is not ready.
4. Register the factory in `env.ts` (`enabledAdapters`), validate its variable in
   `scripts/check-env.mjs`, document it here and in `/cookies/`, and add an E2E stub for its host
   in `tests/e2e/tracking.spec.ts`.

## Environment and build gate

`scripts/check-env.mjs` runs first in `npm run build` (`npm run check:env` standalone). It loads
`.env*` with Next.js precedence, validates formats (pixel id 15–16 digits, Umami URL https and
id together, consent mode enum, checkout URLs on `https://pay.hotmart.com/`), never prints values,
and reports `tracking: meta=on|off umami=on|off mode=strict|advanced`. Variables are listed in
`docs/deployment.md`.

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

## Tests

- `tests/unit/tracking.test.mjs`: forbidden guard, UUID + dataLayer mirror, per-adapter queue and
  flush, drop on reject, consent v2 format and re-prompt, Meta/Umami adapter contracts.
- `tests/e2e/tracking.spec.ts` (only with `E2E_EXPECT_CONSENT=1`): nothing before consent, Aceptar
  → script + replayed events with ids, Rechazar → nothing, Configurar → per-category save, CTA
  click never emits a forbidden event, version bump re-prompts. Third-party hosts are stubbed.
- `tests/e2e/consent.spec.ts`: no banner on the public build; banner controls and footer reopen
  when configured.
