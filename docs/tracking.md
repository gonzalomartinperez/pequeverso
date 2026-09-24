# Tracking and consent

First-party tracking with an opt-out banner (`src/features/tracking/`). Hotmart remains the
source of truth for checkout and purchases; the site only measures interest. The browser
variable is the Meta Pixel id; the server-only `META_CAPI_ACCESS_TOKEN` enables the
Conversions API relay (below); every other behaviour is policy in code.

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
| `CheckoutIntent` | principal CTA click | `product`, `offer`, `cta_position`, `offer_mode` | `fbq('trackCustom')` |

Every event gets a UUID `eventId` (`crypto.randomUUID`), is pushed to `window.dataLayer` as
`{ event, event_id, ...params }`, and reaches Meta as `{ eventID }` from the pixel and as
`event_id` from the Conversions API relay, so browser/server pairs deduplicate. Typed helpers: `trackPageView`, `trackViewContent`, `trackProductInterest`,
`trackCheckoutIntent`; `isTrackingConfigured()` is true when at least one adapter is enabled.

## Forbidden events

`InitiateCheckout`, `Purchase`, `PlaceAnOrder` and `begin_checkout` belong to Hotmart (Web +
API). `FORBIDDEN_EVENTS` in `track.ts` excludes them from the `EventName` union; a runtime guard
throws in development and no-ops in production. Unit and E2E tests assert they never appear in
`dataLayer` or in `fbq` calls, including after a checkout CTA click.

## Conversions API

Same events, second channel: the `meta-capi` adapter posts every event the pixel received to
the same-origin endpoint `POST /api/meta/events/` (trailing slash: the standalone target
308-redirects the slash-less form), and `server/meta-capi.ts` forwards the batch
to `https://graph.facebook.com/v26.0/<pixelId>/events` from the Node server. ADR:
`docs/decisions/ADR-0005-conversions-api-relay.md`.

Flow: `track()` assigns the UUID → the pixel adapter calls `fbq(..., { eventID })` → the relay
adapter buffers `{ name, eventId, time, sourceUrl, params }` for 250 ms (up to 10 per request;
on a fresh visit it waits up to 2 s for fbevents.js to write `_fbp`), adds `fbp` (cookie `_fbp`)
and `fbc` (cookie `_fbc`, or `fb.1.<now ms>.<fbclid>` derived from `?fbclid`), and posts with
`fetch(..., { keepalive })` or `navigator.sendBeacon` on `pagehide` → the server validates, answers
`202` at once and calls Graph API in the background (3 s timeout, one retry on 429/5xx/network
error, token in the `Authorization: Bearer` header, never logged).

Server: `createMetaCapiRelay()` in `server/meta-capi.ts` is a transport-agnostic core
(`process({ method, bodyText, contentType, origin, host, ip, userAgent }) → { status, headers,
body? }` plus the background upstream sender). Two thin adapters call it: the Node `req/res`
handler mounted by `scripts/serve-static.ts` (accepts both `/api/meta/events/` and
`/api/meta/events`), and the standalone route handler
`src/app/api/meta/events/route.standalone.ts` (Next's own server on Hostinger; env read at
request time; IP from `cf-connecting-ip` → first `x-forwarded-for`).

Contract:

| Request | Response |
|---|---|
| `POST /api/meta/events/`, `Content-Type: application/json`, body `{ events: [{ name, eventId, time, sourceUrl, params, fbp?, fbc? }] }` (1–10 events, ≤ 16 KB) | `202` (relayed), `204` (relay disabled: no token or no pixel id) |
| `name` outside `PageView`/`ViewContent`/`PequeversoProductInterest`/`CheckoutIntent`, `eventId` not a UUID v4, `sourceUrl` off-origin, unknown `params` key, non-finite number, string > 200 chars, malformed `fbp`/`fbc`, bad JSON | `400 { "error": "<field>" }` (input never echoed) |
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
   `scripts/check-env.ts`, document it here and in `/cookies/`, block its hosts in
   `tests/e2e/fixtures.ts` and add a stub in `tests/e2e/tracking.spec.ts`. Two adapters may
   share a `label` when they are one tool for the visitor (the banner lists labels once).

## Environment and build gate

`scripts/check-env.ts` runs first in `npm run build` (`npm run check:env` standalone). It loads
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
  flush, drop on reject, consent v2 format and re-prompt, Meta adapter contract (revoke expires
  the cookies), relay adapter (batching, shared event ids, `_fbp`/`_fbc`/`fbclid`, nothing after
  Rechazar, `sendBeacon` on `pagehide`, wait for `_fbp`).
- `tests/unit/meta-capi.test.ts`: server handler against a real `http` server with a fake Graph
  API — validation matrix, disabled → 204, payload shape and bearer header, IP/UA sourcing, retry
  policy and logging, rate limit.
- `tests/e2e/tracking.spec.ts` (only with `E2E_EXPECT_CONSENT=1`): the pixel runs by default with
  ids, Aceptar keeps it, Rechazar → revoke and nothing later (pixel and relay), Configurar →
  per-category save, CTA click never emits a forbidden event, version bump re-prompts, the relay
  receives the pixel's event ids with `_fbp`. Third-party hosts are stubbed; `/api/meta/events/`
  is intercepted.
- `tests/e2e/consent.spec.ts`: no banner on the public build; banner controls and footer reopen
  when configured. `tests/e2e/smoke.spec.ts`: the relay answers `204` on a build without token.
