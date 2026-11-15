# ADR-0016: Consent is its own feature module, a leaf that tracking and site analytics consume

Date: 2026-11-15 · Status: accepted (M4-1) · Amends: ADR-0003 (tracking adapters behind consent),
ADR-0009 (module spine)

## Context

Consent carries one legal rule (prior opt-in, ADR-0011), but it lived in three places: storage,
version and defaults in `tracking/adapters/consent.ts`; a second freshness rule for site analytics
in `site-analytics/domain/consent.ts`; and a hand-written copy of the cookie wire format
(`/^a[01]m1\.v3$/`) in the server relay. Two of them drifted: when ADR-0011 bumped the consent version
to 3, the analytics rule still required version 2 (fixed in #210). The banner, a consent concern,
sat in `tracking/presentation` and imported tracking's adapter list. The master plan
(`docs/master-plan/target-state.md`, section 2) asks for `features/consent` with a domain direction
test.

## Decision

1. `src/features/consent/` with three layers:
   - `domain/policy.ts`: import-free and pure. It holds the version, storage key, event name and 180-day lifetime; the
     categories and the prior-opt-in default; the stored-JSON parser; the cookie serializer and its
     inverse; the server-side cookie-header gate; the category check (`grants`); the analytics
     freshness rule (`explicitGrant`); the withdrawal gate (`createConsentGate`); and the
     `GatedIntegration` contract the banner receives. It is
     import-free so the server relay can load it under plain `node`.
   - `adapters/browser-storage.ts`: localStorage, cookie and window events (`readConsent`,
     `writeConsent`, `expireConsentCookie`, `onConsentChange`, `hasConsent`).
   - `presentation/`: the banner trigger, the lazy banner UI and the footer settings link.
2. Dependency direction: tracking, site analytics and the composition layers import consent; consent
   imports nothing from another feature. Inside consent, domain <- adapters <- presentation, and
   presentation may also use `src/shared`. The banner learns which gated integrations exist from
   props the root layout passes in (`integrations` and `analyticsBuilt`, from
   `tracking/presentation/consent-integrations.ts`), not by importing tracking.
3. No forwarding modules: the old paths are deleted and every consumer imports the new ones.

## Consequences

- Good: one source per legal rule. A consent version bump changes the browser, the analytics gate
  and the server relay together. The banner and its policy can change without touching vendor
  adapters.
- Residual coupling, accepted:
  - The banner UI still reads the site-analytics build flag
    (`NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED`) inline, because Next must dead-code-eliminate the
    analytics copy from publishable builds (`tests/unit/site-analytics/consent-build.test.ts`).
  - It also dispatches the string event `pv:site-analytics:withdraw`.
  - The banner trigger receives the same flag as the `analyticsBuilt` prop (from tracking's
    `siteAnalyticsBuilt`), so the fact has two read paths. Because a prop is a runtime value, the
    trigger keeps the small `explicitGrant` check in the initial bundle of publishable builds as
    well; the bundle budget (`npm run check:bundle`) is the gate on that cost.
  - Neither is a module import. Moving them behind a contributed integration is a candidate for
    MV-2, when site analytics is enabled.
- Mutation scope follows the code: Stryker mutates `features/consent/domain` and `adapters`. The
  relay and site-analytics unit tests join the Stryker test set because they exercise the moved
  rules.

## Confirmation

`tests/unit/architecture.test.ts` ("keeps consent a leaf feature with inward layers") rejects, with
negative fixtures, consent importing tracking, site analytics or composition, a domain import of
adapters or packages, an outward layer import and a runtime-selected import. It then checks every
real consent module. The placement rule in `tests/helpers/source-architecture.ts` allows only the
three layers. The behaviour tests (`tracking`, `meta-capi`, `site-analytics/*`, the consent
property test) are unchanged apart from import paths.
