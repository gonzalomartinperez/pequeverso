# Changelog

All notable changes are recorded here. The format follows Keep a Changelog; versions are tags.

## [Unreleased]

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
