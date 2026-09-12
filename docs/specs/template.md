# Spec: <page or section>

**Central idea:** what the visitor must understand and do (one sentence).
**Primary action:** one CTA target (checkout URL / Hotmart widget / Hotmart consumer area / internal link).
**Route:** `/…/` · **robots:** index | noindex · **canonical:** self | other

## Sections (in order)

| # | Section | Purpose | Copy source | Media | Behaviour |
|---|---|---|---|---|---|
| 1 | | | `content/es/…` | `media/manifest.json#…` | |

## Behaviours and events

- CTA parameters, events (`ViewContent`, `CheckoutIntent`, …), offer modes, failure fallbacks.

## Acceptance

- Widths: 1440 / 1280 / 1024 / 768 / 430 / 390 / 360 (+320 reflow) — no horizontal overflow.
- Keyboard-only path to the primary action; focus visible; targets ≥ 24 px.
- Contrast from tokens only; reduced motion honoured; CLS ≤ 0.1; LCP element prioritized.
- Playwright spec(s): `tests/e2e/…`

## Open decisions

- Anything that needs the owner (price, guarantee, claims, rights).
