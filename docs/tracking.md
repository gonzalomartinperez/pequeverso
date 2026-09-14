# Tracking and consent

First-party tracking with an opt-out banner (`src/features/tracking/`). Hotmart remains the
source of truth for checkout and purchases; the site only measures interest. The only variable
is the Meta Pixel id; every other behaviour is policy in code.

## Adapters

| Adapter (`id`) | Variable | Category | Loads | Withdrawn by |
|---|---|---|---|---|
| Meta Pixel (`meta`) | `NEXT_PUBLIC_META_PIXEL_ID` | `marketing` | after hydration, active from `init`, unless a stored rejection exists | "Rechazar" → `fbq('consent','revoke')`; no script on later visits |

An adapter is `enabled` only when its variable is set at build time. With none enabled the
module is inert: no scripts, no banner (the footer control shows a necessary-cookies notice),
`window.dataLayer` still mirrors events for debugging.

## Event mapping

| Event | Trigger | Parameters | Meta |
|---|---|---|---|
| `PageView` | first load + every client navigation (once per path) | — | `fbq('track')` |
| `ViewContent` | product landing mount; upsell/downsell mount (`content_name` suffixed with the mode) | `content_ids`, `content_name`, `content_type: product`, `value`, `currency` | `fbq('track')` |
| `PequeversoProductInterest` | hub → product link click | `product`, `cta_position`, `destination` | `fbq('trackCustom')` |
| `CheckoutIntent` | principal CTA click | `product`, `offer`, `cta_position`, `offer_mode` | `fbq('trackCustom')` |

Every event gets a UUID `eventId` (`crypto.randomUUID`), is pushed to `window.dataLayer` as
`{ event, event_id, ...params }`, and reaches Meta as `{ eventID }` so Hotmart's server-side
events deduplicate. Typed helpers: `trackPageView`, `trackViewContent`, `trackProductInterest`,
`trackCheckoutIntent`; `isTrackingConfigured()` is true when at least one adapter is enabled.

## Forbidden events

`InitiateCheckout`, `Purchase`, `PlaceAnOrder` and `begin_checkout` belong to Hotmart (Web +
API). `FORBIDDEN_EVENTS` in `track.ts` excludes them from the `EventName` union; a runtime guard
throws in development and no-ops in production. Unit and E2E tests assert they never appear in
`dataLayer` or in `fbq` calls, including after a checkout CTA click.

## Consent (opt-out)

Categories: `necessary` (implicit), `analytics`, `marketing`. Policy: `DEFAULT_CHOICE` in
`consent.ts` grants every category until the visitor decides (owner decision, 2026-09-14: the
pixel measures campaigns from the first page view; the banner is the withdrawal control). Store:
`localStorage.pv_consent` (`{ version: 2, analytics, marketing, updatedAt }`) plus cookie
`pv_consent=a<0|1>m<0|1>.v2` (6 months) for a future server-side check. `CONSENT_VERSION = 2`;
bumping it re-prompts every visitor. Changes are broadcast on `window` as `pv:consent`.

`ConsentBanner` shows on the first visit when an enabled adapter has a gated category. Actions:
**Aceptar** (store the grant), **Rechazar** (deny all: `onConsent` revokes the vendor, the queue
is dropped, later events are never sent, and the script is not injected on later visits),
**Configurar** (one checkbox per gated category, checked by default, then "Guardar selección").
The footer `CookieSettingsLink` reopens it (`pv:consent:open`) with the stored selection; with no
gated integration it opens a necessary-cookies notice instead.

`TrackingScripts` injects vendor scripts only after reading the stored choice on the client (no
hydration mismatch, nothing for a rejected category). Events raised while a script is still
loading stay queued until `syncConsent()` runs on script load.

Legal note: an opt-out default does not meet the AEPD / ePrivacy prior-consent criteria for
marketing cookies. Switching to prior consent is a one-line change (`DEFAULT_CHOICE` all false)
plus the banner copy; the tests in `tests/e2e/tracking.spec.ts` encode the current policy.

## Adding an adapter (TikTok, gtag, ...)

1. Add the id to `AdapterId` and a factory `createXAdapter(config)` in `adapters/x.ts` returning
   `TrackingAdapter` (`enabled` false when its variable is empty; `label` used in the banner).
2. `scripts()` returns the vendor stub and loader as `ScriptSpec`s. `onConsent(state)` maps the
   stored choice to the vendor's grant/revoke call.
3. `send(event)` maps standard names to the vendor's standard events, passes `eventId` as the
   vendor's dedup id and returns `false` while the vendor global is not ready.
4. Register the factory in `env.ts` (`enabledAdapters`), validate its variable in
   `scripts/check-env.mjs`, document it here and in `/cookies/`, block its hosts in
   `tests/e2e/fixtures.ts` and add a stub in `tests/e2e/tracking.spec.ts`.

## Environment and build gate

`scripts/check-env.mjs` runs first in `npm run build` (`npm run check:env` standalone). It loads
`.env*` with Next.js precedence, validates formats (pixel id 15–16 digits, checkout URLs on `https://pay.hotmart.com/`), never prints values,
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
