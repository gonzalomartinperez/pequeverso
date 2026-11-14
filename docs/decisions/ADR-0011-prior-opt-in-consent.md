# ADR-0011: Prior opt-in consent for marketing measurement

Date: 2026-11-14 · Status: accepted (M3-C1) · Amends: [ADR-0003](ADR-0003-tracking-adapters.md)

## Context

ADR-0003 kept the adapter architecture and, through an owner decision of 2026-09-14, set the
consent policy to opt-out: `DEFAULT_CHOICE` granted every category and the banner only withdrew
it, so the Meta Pixel (about 209 KB of third-party script) loaded on the first page view. That
does not meet the prior-consent criteria (ePrivacy, AEPD) that apply to marketing cookies, it
sits poorly with Ley 25.326 art. 5 (free, express, informed consent), and it was the largest
third-party cost on the home page (audit findings, `docs/master-plan/audit.md`). The owner
resolved PV-D1 and DR-01 in favour of opt-in and accepted the consequence that measured event
volume drops (`docs/master-plan/README.md` section 7).

## Decision

- No consent category runs before the visitor chooses. `DEFAULT_CHOICE` is all `false`; a stored
  choice is the only grant. `CONSENT_VERSION` is 3, so every earlier stored choice (made under
  the opt-out policy) re-prompts.
- The banner offers "Aceptar", "Rechazar" and "Configurar" with equal size, weight and
  prominence, and renders after first paint so it is neither the LCP element nor a layout shift.
- The Meta Pixel stub and `fbevents.js` are injected only after a stored marketing grant, and the
  loader waits for `requestIdleCallback` (timeout fallback). Withdrawing the grant revokes the
  pixel and expires `_fbp`/`_fbc` as before.
- The Conversions API relay (`/api/meta/events/`) is gated server-side: it forwards an event only
  when the request carries the `pv_consent` cookie of the current version with marketing granted
  (`a?m1.v3`); anything else answers `204` and is dropped.
- Invariant: `third_party_requests_before_consent == 0` means no cross-origin request at all on
  any public route (derived from the product registry and legal route table) before a choice,
  and no request to the same-origin relay before a grant. Asserted by
  `tests/browser/tracking.spec.ts`, which also requires the banner to be visible so the check
  cannot pass on a build without tracking.
- Functional exception: the Hotmart purchase widget and the hosts it loads (`*.hotmart.com`) are
  allowed before a choice. They are strictly necessary for the purchase service the visitor
  explicitly requests, they carry no measurement or advertising purpose of ours, and Hotmart owns
  payment and delivery. No other host is exempt.
- Consent is always re-read from validated storage: `pv:consent` and cross-tab `storage` events
  only signal that storage changed, the pending idle load re-checks storage before injecting and
  is cancelled on a withdrawal in any tab, and the relay requires exactly one `pv_consent`
  cookie with a valid v3 marketing grant.
- Unchanged: the site never emits `InitiateCheckout` or `Purchase`; Hotmart owns the checkout.

## Consequences

- Measured event volume drops to the share of visitors who accept. Accepted by the owner.
- A page view before the choice is not replayed after "Aceptar"; measurement starts from the
  next event or navigation.
- The first-visit home page loads no Meta script, which is the M3-C5 performance baseline change.
- `/cookies/` and `/privacidad/` copy follows in M3-C4.
