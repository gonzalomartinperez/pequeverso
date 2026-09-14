# Changelog

All notable changes are recorded here. The format follows Keep a Changelog; versions are tags.

## [Unreleased]

### Changed
- Tracking policy: the Meta Pixel runs by default when `NEXT_PUBLIC_META_PIXEL_ID` is set and
  the banner withdraws it (`Rechazar` revokes the pixel, choice kept six months; no script on
  later visits). "Configurar" shows marketing active by default.

### Removed
- `NEXT_PUBLIC_CONSENT_MODE`, `NEXT_PUBLIC_TRACKING_DEBUG` and the Umami adapter with its two
  variables: the deployment surface is site URL, checkout override and pixel id only.

## [0.2.0] — 2026-09-14

Site v2: design system, motion, product registry, tracking v2 and a lean CI.

### Added
- Typed product registry (`src/products`, Zod) rendered through `[product]` and
  `[product]/gracias` routes with `CoreLanding` / `OfferLanding` / `ThanksPage` templates and
  minimal Product + Offer JSON-LD; adding a product is a registry entry plus content.
- UI primitives (`Section`, `Card`, `IconBadge`, `Grid`, `Split`, `Stack`, `BulletList`,
  `ChipRow`, `Eyebrow`, `MediaFrame`, `IconCardList`, `DecisionLink`) with container queries and
  tokens v2 (hero navy, turquoise accent, motion tokens).
- CSS-first motion system: scroll-driven reveals with a Firefox fallback, `Parallax`,
  `StickyStack`, `Counter`, `FlipPreview` (React `ViewTransition`), `WaveDivider`, `Orbit`,
  single `Universe` per page, `useMotionOK` gate (reduced motion, coarse pointer, Save-Data).
- Hero v2 "la mesa bajo el pequeño universo": 3D fan of real worksheets with `AgeSelector`
  (3–4 · 5 · 6–7) and a sticky price card; CRO section order and natural Spanish copy on the
  landing, home, upsell/downsell and thanks pages; "para quién es / no es" and currency FAQ.
- Tracking v2: adapter interface (Meta with `fbq consent` revoke/grant, Umami), `track()` with
  event ids and `dataLayer` mirror, forbidden-event guard, consent v2 with per-category choice,
  `scripts/check-env.mjs`, `NEXT_PUBLIC_CONSENT_MODE`; "Configurar cookies" always answers.
- Quality gates: bundle budgets per route, rendered-HTML checks, content invariants, media group
  budgets and rights gate, `knip`, `PW_SET` Playwright sets (pr / nightly / visual / prod), LCP
  spec, visual baselines spec, post-deploy verification workflow, nightly matrix with link check
  and bundle analysis, Dependabot cooldowns.
- Media: AVIF per role, clip caps, transparent unpadded favicon set, self-hosted fonts with
  metric fallbacks and preload.

### Changed
- Checkout links default to the public Hotmart checkout and open in a new tab; `formatUsd`
  prints `US$14,99`.
- Social links are icon-only 44 px circles with visually hidden names.
- CI runs one build per PR and only production verification on `main`.

### Removed
- `motion` dependency (hero choreography fits in CSS + `ViewTransition`), `TrustStrip`,
  legacy `.section--*` band classes, per-page `page.module.css` duplication.

## [0.1.0] — 2026-09-12

First public release of pequeverso.com (site v1).

### Added
- Repository foundation: Next.js 16.3 App Router static export (Node standalone kept as a
  parity build), TypeScript strict, Biome, self-hosted OFL fonts, design tokens, edge-rules single
  source rendered to `.htaccess` and `next.config`, build-info revision stamp, production-like
  static server (trailing slash, real 404, brotli/gzip, cache headers).
- Design system: "pequeño universo" backdrop (CSS starfield, planets, orbit), tilt cards, Embla
  page gallery with keyboard/dots/counter and `<dialog>` zoom, click-to-play video block, steps,
  FAQ, price block, trust strip, sticky mobile CTA, consent banner.
- Pages: home (hub), `/grafismo-fonetico/` (principal landing), `/imprime-y-juega/` (upsell with
  pre-paint `?downsell=1` mode and a single Hotmart sales-funnel widget slot with fallback),
  `/grafismo-fonetico/gracias/` (neutral post-purchase guidance), legal pages (aviso legal,
  privacidad, cookies, términos, compras y reembolsos), `/soporte/`, real 404 and error pages.
- Commerce: checkout links with allowlisted acquisition params (`off`/`ref` never forwarded), one
  `CheckoutIntent` per click, `ViewContent`, product-interest links; consent-gated first-party
  Meta Pixel helper; optional cookie-less Umami.
- Media pipeline (`tools/media`): sharp/ffmpeg build, 169 committed derivatives (15.07 MB),
  provenance and rights manifest, favicon set, OG card, typed `getImage`/`getVideo` helper.
- Quality: unit tests (edge rules, checkout params, commerce facts), Playwright (smoke, axe WCAG
  2.2 AA, offer modes, widget lifecycle, commerce, consent, motion, navigation crawl) on
  1440/768/390 + reduced motion, nightly 7-width Chromium/WebKit matrix, Lighthouse CI budgets.
- Delivery: CI gate (`ci`), branch policy, Dependabot, gated Deploy workflow publishing the export
  to the `deploy` branch for Hostinger Git with revision verification and launch gates
  (no placeholders, media rights confirmed).
- Docs: architecture, development, deployment, code quality, design system, content model,
  tracking, media, migration (with the old-domain `.htaccess` block), legal checklist, ADR-0001.
