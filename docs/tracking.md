# Tracking and consent

First-party tracking with a prior opt-in banner (`src/features/tracking/`). Hotmart remains the
source of truth for checkout and purchases; the site only measures interest. The browser
variable is the Meta Pixel id; the server-only `META_CAPI_ACCESS_TOKEN` enables the
Conversions API relay (below); every other behaviour is policy in code. CI uses the fake pixel id
`1234567890123456`; the Lighthouse lanes block every `*.facebook.com` request so no event reaches Meta
(`docs/development.md`, Lighthouse lanes).

## Adapters

| Adapter (`id`) | Variable | Category | Loads | Withdrawn by |
|---|---|---|---|---|
| Meta Pixel (`meta`) | `NEXT_PUBLIC_META_PIXEL_ID` | `marketing` | after hydration, active from `init`, unless a stored rejection exists | "Rechazar" → `fbq('consent','revoke')`, `_fbp`/`_fbc` expired; no script on later visits |
| Meta Conversions API (`meta-capi`, label "Meta Pixel") | `NEXT_PUBLIC_META_PIXEL_ID` (+ `META_CAPI_ACCESS_TOKEN` on the server) | `marketing` | no script; `POST /api/meta/events/` batches from the first event | the tracker stops dispatching; the buffer is dropped |

An adapter is `enabled` only when its variable is set at build time. With none enabled the
module is inert: no scripts, no banner (the footer control shows a necessary-cookies notice),
`window.dataLayer` still mirrors events for debugging.

## Event mapping

| Event | Trigger | Parameters | Meta |
|---|---|---|---|
| `PageView` | first load + every client navigation (once per path) | — | `fbq('track')` |
| `ViewContent` | product landing mount; upsell/downsell mount (`content_name` suffixed with the mode) | `content_ids`, `content_name`, `content_type: product`, `value`, `currency` | `fbq('track')` |
| `PequeversoProductInterest` | hub → product link click | `product`, `cta_position`, `destination` | `fbq('trackCustom')` |
| `PequeversoAffiliateClick` | click on a recommended third-party product (`AffiliateLink`, docs/reference/affiliates.md) | `product`, `cta_position`, `destination` | `fbq('trackCustom')` |
| `CheckoutIntent` | principal CTA click | `product`, `offer`, `cta_position`, `offer_mode` | `fbq('trackCustom')` |

Every event gets a UUID `eventId` (`crypto.randomUUID`), is pushed to `window.dataLayer` as
`{ event, event_id, ...params }`, and reaches Meta as `{ eventID }` from the pixel and as
`event_id` from the Conversions API relay, so browser/server pairs deduplicate. Typed helpers: `trackPageView`, `trackViewContent`, `trackProductInterest`,
`trackCheckoutIntent`, `trackAffiliateClick`; `isTrackingConfigured()` is true when at least one adapter is enabled.

## Forbidden events

`InitiateCheckout`, `Purchase`, `PlaceAnOrder` and `begin_checkout` belong to Hotmart (Web +
API). `FORBIDDEN_EVENTS` in `track.ts` excludes them from the `EventName` union; a runtime guard
throws in development and no-ops in production. Unit and E2E tests assert they never appear in
`dataLayer` or in `fbq` calls, including after a checkout CTA click.

## Conversions API

Same events, second channel: the `meta-capi` adapter posts every event the pixel received to
the same-origin endpoint `POST /api/meta/events/` (trailing slash: the standalone target
308-redirects the slash-less form), and `src/features/tracking/adapters/server/meta-capi.ts` forwards the batch
to `https://graph.facebook.com/v26.0/<pixelId>/events` from the Node server. ADR:
`docs/decisions/ADR-0005-conversions-api-relay.md`.

Flow: `track()` assigns the UUID → the pixel adapter calls `fbq(..., { eventID })` → the relay
adapter buffers `{ name, eventId, time, sourceUrl, params }` for 250 ms (up to 10 per request;
on a fresh visit it waits up to 2 s for fbevents.js to write `_fbp`), adds `fbp` (cookie `_fbp`)
and `fbc` (cookie `_fbc`, or `fb.1.<now ms>.<fbclid>` derived from `?fbclid`), and posts with
`fetch(..., { keepalive })` or `navigator.sendBeacon` on `pagehide` → the server validates, answers
`202` at once and calls Graph API in the background (3 s timeout, one retry on 429/5xx/network
error, token in the `Authorization: Bearer` header, never logged).

Server: `createMetaCapiRelay()` in `src/features/tracking/adapters/server/meta-capi.ts` is a transport-agnostic core
(`process({ method, bodyText, contentType, origin, host, ip, userAgent }) → { status, headers,
body? }` plus the background upstream sender). Two thin adapters call it: the Node `req/res`
handler mounted by `tools/serve-static.ts` (accepts both `/api/meta/events/` and
`/api/meta/events`), and the standalone route handler
`src/app/api/meta/events/route.standalone.ts` (Next's own server on Hostinger; env read at
request time; IP from `cf-connecting-ip` → first `x-forwarded-for`).

Contract:

| Request | Response |
|---|---|
| `POST /api/meta/events/`, `Content-Type: application/json`, body `{ events: [{ name, eventId, time, sourceUrl, params, fbp?, fbc? }] }` (1–10 events, ≤ 16 KB) | `202` (relayed), `204` (relay disabled: no token or no pixel id) |
| `name` outside `PageView`/`ViewContent`/`PequeversoProductInterest`/`PequeversoAffiliateClick`/`CheckoutIntent`, `eventId` not a UUID v4, `sourceUrl` off-origin, unknown `params` key, non-finite number, string > 200 chars, malformed `fbp`/`fbc`, bad JSON | `400 { "error": "<field>" }` (input never echoed) |
| body > 16 KB · other `Content-Type` · `Origin` not the site/host · non-POST · > 60 events/min per IP | `413` · `415` · `403` · `405` · `429` |

Every response carries `Cache-Control: no-store` (also in `config/edge-rules.json` for `/api/*`).
`time` is clamped to the last 10 minutes. Graph API receives per event: `event_name`,
`event_time` (seconds), `event_id`, `event_source_url`, `action_source: "website"`,
`user_data: { client_ip_address, client_user_agent, fbp, fbc }` (IP from `cf-connecting-ip`, then
the first `x-forwarded-for`, then the socket; none of these are hashed, as Meta requires) and
`custom_data` with the allowlisted parameters. No PII exists on the site, so nothing else is sent.

Consent: server events are sent only while marketing measurement is allowed. After "Rechazar" the
tracker stops dispatching to `marketing` adapters, the relay drops anything still buffered and the
pixel adapter expires `_fbp`/`_fbc`; on later visits neither channel runs.

Verification (owner): Events Manager → the pixel → **Overview**: site events show the connection
method **Browser** and **Server** with a "deduplicated" count; **Test events** would need a test
event code and we deliberately ship none (no variable, no header). The server logs one line per
upstream failure (`meta-capi: upstream 4xx 400 code=190 ...` = invalid token) and
`meta-capi: enabled|disabled` at boot. A missing or invalid token never affects the page: the
endpoint answers `204`/`202` before Meta is contacted.

Static hosting mode (`deploy` branch, no Node) has no relay: the endpoint returns the 404 page and
the browser ignores it. Only the Node.js Web App mode gains the Conversions API.

## Consent (prior opt-in)

Policy: [ADR-0011](decisions/ADR-0011-prior-opt-in-consent.md). Categories: `necessary` (implicit),
`analytics`, `marketing`. `DEFAULT_CHOICE` in `consent.ts` is all `false`: nothing gated runs and
nothing third-party is requested until the visitor chooses. Store: `localStorage.pv_consent`
(`{ version: 3, analytics, marketing, updatedAt }`) plus cookie `pv_consent=a<0|1>m<0|1>.v3`
(6 months), which the Conversions API relay reads. `CONSENT_VERSION = 3`; a choice stored under an
older version is ignored and re-prompts. Changes are broadcast on `window` as `pv:consent`.

`ConsentBanner` appears after first paint on the first visit when an enabled adapter has a gated
category. Three equal buttons: **Aceptar** (store the grant), **Rechazar** (deny all: `onConsent`
revokes the vendor, the queue is dropped, later events are never sent, no script on later visits),
**Configurar** (one unchecked checkbox per gated category, then "Guardar selección"). The footer
`CookieSettingsLink` reopens it (`pv:consent:open`) with the stored selection; with no gated
integration it opens a necessary-cookies notice instead.

`TrackingScripts` injects vendor scripts only after reading the stored choice on the client and
only for a granted category. The Meta bootstrap stub is inline; `fbevents.js` (`idle: true` in its
`ScriptSpec`) loads after `requestIdleCallback` (2 s timeout fallback). Events raised before a
choice are dropped, not queued; events raised while the script loads stay queued until
`syncConsent()` runs on script load. The relay (`/api/meta/events/`) answers `204` and forwards
nothing unless the request cookie carries `a?m1.v3`.

Invariant: `third_party_requests_before_consent == 0` on every public route.

## Adding an adapter (TikTok, gtag, ...)

1. Add the id to `AdapterId` and a factory `createXAdapter(config)` in `adapters/x.ts` returning
   `TrackingAdapter` (`enabled` false when its variable is empty; `label` used in the banner).
2. `scripts()` returns the vendor stub and loader as `ScriptSpec`s. `onConsent(state)` maps the
   stored choice to the vendor's grant/revoke call.
3. `send(event)` maps standard names to the vendor's standard events, passes `eventId` as the
   vendor's dedup id and returns `false` while the vendor global is not ready.
4. Register the factory in `env.ts` (`enabledAdapters`), validate its variable in
   `tools/check-env.ts`, document it here and in `/cookies/`, block its hosts in
   `tests/browser/fixtures.ts` and add a stub in `tests/browser/tracking.spec.ts`. Two adapters may
   share a `label` when they are one tool for the visitor (the banner lists labels once).

## Environment and build gate

`tools/check-env.ts` runs first in `npm run build` (`npm run check:env` standalone). It loads
`.env*` with Next.js precedence, validates formats (pixel id 15–16 digits, checkout URLs on
`https://pay.hotmart.com/`, `META_CAPI_ACCESS_TOKEN` ≥ 32 characters without whitespace when
present), never prints values, and reports `tracking: meta=on|off capi=on|off`. Variables are
listed in `docs/deployment.md`.

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

- `tests/unit/tracking.test.ts`: forbidden guard, UUID + dataLayer mirror, per-adapter queue and
  flush, drop on reject, consent v3 format and re-prompt, Meta adapter contract (revoke expires
  the cookies), relay adapter (batching, shared event ids, `_fbp`/`_fbc`/`fbclid`, nothing after
  Rechazar, `sendBeacon` on `pagehide`, wait for `_fbp`).
- `tests/unit/meta-capi.test.ts`: server handler against a real `http` server with a fake Graph
  API — validation matrix, disabled → 204, payload shape and bearer header, IP/UA sourcing, retry
  policy and logging, rate limit.
- `tests/browser/tracking.spec.ts` (only with `E2E_EXPECT_CONSENT=1`): no Meta request before a
  choice on every public route, Rechazar keeps it at zero, Aceptar loads `fbevents.js` after idle,
  Rechazar after loading → revoke and nothing later (pixel and relay), Configurar → per-category save, CTA click never emits a forbidden event, version bump re-prompts, the relay
  receives the pixel's event ids with `_fbp`. Third-party hosts are stubbed; `/api/meta/events/`
  is intercepted.
- `tests/browser/consent.spec.ts`: no banner on the public build; banner controls and footer reopen
  when configured. `tests/browser/smoke.spec.ts`: the relay answers `204` on a build without token.

## Separate opt-in site aggregates

[Optional site analytics](reference/site-analytics.md) uses an independent default-off build switch and requires
an explicit stored analytics grant. It shares the prior opt-in policy described above (no grant, no run),
use the vendor queue, or emit purchase/checkout events. Both integrations retain the existing
preference storage; the additional analytics category is visible only in a configured build.
