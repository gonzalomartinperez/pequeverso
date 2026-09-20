# ADR-0005: Meta Conversions API relay inside our own Node server

Date: 2026-09-20 · Status: accepted

## Context

Browser-only pixels lose a share of events to ad blockers, ITP and rejected scripts, and the
match quality of the remaining ones is limited to `_fbp`/`_fbc`. Meta's Conversions API (CAPI)
accepts the same events from a server, deduplicated against the browser pixel by `event_id` +
`event_name`. The WordPress site had CAPI through PixelYourSite; the new site had none
(ADR-0003: "no server-side event API from the site").

Constraints: the site is a static export (`output: "export"`), which refuses route handlers
with `POST`; both build targets must keep working; the owner wants one new variable at most and
no new deploy credentials; the site collects no PII (Hotmart owns the checkout), so `Purchase`
stays with Hotmart's own pixel + CAPI integration.

## Decision

- A same-origin endpoint `POST /api/meta/events` implemented as a plain Node handler
  (`server/meta-capi.mjs`, zero dependencies) and mounted in the servers we already run:
  `scripts/serve-static.mjs` for the export, and for the standalone target a small front server
  (`server/front.mjs`) that answers the endpoint itself and proxies everything else to Next's
  standalone `server.js` on a loopback port (`PORT + 1`).
- Not a Next route handler: `output: "export"` fails the build on a non-GET handler, and the
  static export is the primary target and the CI artifact.
- Not a Cloudflare Worker: it would need Cloudflare deploy credentials in CI or a manual deploy
  step outside the repository's release flow, and a second place to keep in sync with the event
  allowlist. The Node server is already deployed with every release.
- The browser adapter `meta-capi` (`src/features/tracking/adapters/meta-capi.ts`) relays each
  event the pixel receives, with the same `eventId`, batched (250 ms, ≤ 10 per request) and
  flushed on `pagehide` with `sendBeacon`. It shares the `marketing` consent category and the
  banner label "Meta Pixel": from the visitor's point of view it is the same tool.
- Exactly one new variable, server-only: `META_CAPI_ACCESS_TOKEN` (hPanel → Environment
  variables). The pixel id is reused from `NEXT_PUBLIC_META_PIXEL_ID`. Empty token = the endpoint
  answers `204` and Meta is never called. No test-event-code variable: verification uses Events
  Manager's Overview (connection method "Server").
- The token travels to Graph API as an `Authorization: Bearer` header (never in the URL or the
  body), the server validates a strict allowlist of events and parameters (the forbidden set
  `InitiateCheckout`/`Purchase`/`PlaceAnOrder`/`begin_checkout` is rejected explicitly), clamps
  `event_time` to the last 10 minutes, rate-limits per client IP and never logs payloads.

## Consequences

- Server events carry `client_ip_address`, `client_user_agent`, `fbp` and `fbc` only; there is
  no hashed PII because the site has none. Match quality therefore depends on `_fbp`, so the
  adapter waits up to 2 s on a fresh visit for fbevents.js to write it before flushing.
- A rejection stops both: the tracker no longer dispatches to `marketing` adapters, the relay
  drops its buffer and the pixel adapter expires `_fbp`/`_fbc`.
- The static hosting mode (`deploy` branch on LiteSpeed, no Node) has no relay: the endpoint
  returns the 404 page and the browser ignores it. Only the Node.js Web App mode gains CAPI.
- One more process hop on the standalone target (front server → Next). Measured locally as
  negligible; headers, status, ranges and compression pass through unchanged.
