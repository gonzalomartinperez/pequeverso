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
  `onConsent(state)`, `send(event)`); Meta (marketing, consent API `revoke`/`grant`) is
  implemented. Adding a provider is a new adapter file plus an
  environment variable; pages never change.
- Consent v2 stores per-category decisions (`analytics`, `marketing`) with a version that forces a
  re-prompt when the policy changes. Policy lives in code (`DEFAULT_CHOICE`): since 2026-09-14
  measurement is on by default and the banner withdraws it (owner decision; see the legal note in
  `docs/tracking.md`). The earlier `NEXT_PUBLIC_CONSENT_MODE` and Umami variables were removed so
  the deployment surface is site URL, checkout override and pixel id only.
- `InitiateCheckout`, `Purchase`, `PlaceAnOrder` and `begin_checkout` are forbidden at the type
  level and guarded at runtime: Hotmart owns them.
- `scripts/check-env.mjs` validates variable formats before every build and prints the enabled
  adapters without printing values.

## Consequences

- Site-side events under-count visitors who reject; Hotmart checkout and purchase events remain
  complete.
- No server-side event API from the site (static target); Hotmart's server events cover purchases.
- Tests run with a fake id; `tests/e2e/fixtures.ts` aborts every Meta host, so CI never contacts Meta.
