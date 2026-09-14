# ADR-0003: Tracking adapters behind consent

Date: 2026-09-13 · Status: accepted

## Context

The WordPress site relied on PixelYourSite (Meta Pixel with CAPI) and a consent banner that was
disabled on commercial routes by a business decision. The new site needs first-party tracking that
works from environment variables alone, respects consent in Spain and LATAM, and can gain
providers (TikTok, Google) without touching pages.

## Decision

- One `track(name, params)` entry point in `src/features/tracking/track.ts` generates a UUID
  event id, mirrors the event to `window.dataLayer` and fans out to enabled adapters.
- Adapters implement `TrackingAdapter` (`id`, `category`, `enabled`, `scripts(mode)`,
  `onConsent(state)`, `send(event)`); Meta (marketing, consent API `revoke`/`grant`) and Umami
  (cookieless, no consent) are implemented. Adding a provider is a new adapter file plus an
  environment variable; pages never change.
- Consent v2 stores per-category decisions (`analytics`, `marketing`) with a version that forces a
  re-prompt when the policy changes. `NEXT_PUBLIC_CONSENT_MODE=strict` (default) injects gated
  scripts only after consent; `advanced` loads Meta immediately revoked and grants later.
- `InitiateCheckout`, `Purchase`, `PlaceAnOrder` and `begin_checkout` are forbidden at the type
  level and guarded at runtime: Hotmart owns them.
- `scripts/check-env.mjs` validates variable formats before every build and prints the enabled
  adapters without printing values.

## Consequences

- Site-side events under-count visitors who reject; Hotmart checkout and purchase events remain
  complete.
- No server-side event API from the site (static target); Hotmart's server events cover purchases.
- Tests run with fake ids and stubbed third-party hosts, so CI never contacts Meta or Umami.
