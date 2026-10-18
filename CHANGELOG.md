# Changelog

All notable changes are recorded here. The format follows Keep a Changelog; versions are tags.

## [Unreleased]

### Changed
- Home product chooser identifies both canonical product names on phones, gives both actions
  the same width and distinguishes the Pequeverso kit from the affiliate course. First-meals
  copy describes the guidance without promising an absence of fear or time in the kitchen.
- Glass surfaces use painted translucency instead of repeated backdrop filters, preserving
  brand colors, borders and elevation while avoiding the WebKit 2370 rendering regression.
  Playwright remains on the current 1.64.1 release; browser assertions and timeouts are unchanged.

### Fixed
- The floating offer keeps its price on one line while its explanatory note yields space
  and truncates within the available width.

## [1.0.0] — 2026-10-13

pequeverso.com v1: the home is the hub of two products. Grafismo Fonético is Pequeverso's own kit.
Guía de Alimentación para Bebés is a recommended Hotmart affiliate course. Hostinger builds every
merge to `main`.

### Added
- Affiliate redirect `/alimentacion-bebe/` (`config/edge-rules.json`, 302 with query passthrough).
  The destination lives only in `NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE` (hPanel), and
  `check-env` validates it (docs/affiliates.md).
- Affiliate disclosures: in the legal notice (`/aviso-legal/#afiliados`), terms, privacy and
  cookies, and next to every affiliate link with the commission wording.

### Fixed
- Hostinger Node builder: `/hbuilds/` is detected in one place (`scripts/lib/build-target.ts`), so
  the build info and the assistant-disabled check follow the standalone output.

### Changed
- Dependencies updated to the latest release of each line (Next 16.4). Playwright stays on 1.63
  because the WebKit build in 1.64 stops painting with `backdrop-filter` on Linux (see
  `.github/dependabot.yml`).
- Docs: Hostinger is connected to `main` and auto-deploys every merge (docs/deployment.md).

### Changed
- Home redesigned as the hub of two products with the same weight from the hero to the close
  (docs/specs/home-hub.md): need selector with two doors («Aprender a leer · 3 a 7 años», «Empezar a
  comer · 6 a 12 meses»), shared trust strip, mirrored chapters `#leer` and `#bebe` (stable anchors
  for bios, plus `#grafismo-fonetico` / `#alimentacion-bebe`), FAQ by product and a close with both.
  Header «Productos» mega-menu (native popover, zero JS to open) on the home, auto-hiding header and contextual phone sticky bar on the home, footer «Productos» with both.
  The landing, offer and thank-you pages keep their own header and the Hotmart funnel as they were.
- Media: four new images of the course from the content-studio set with faces
  (`bebe.scene.primera-papilla`, `bebe.scene.menu`, `bebe.cutout.mama-brazos`, `bebe.cutout.planeta`);
  `bebe.scene.mama`, `bebe.scene.mama-vertical` and `gf.life.logro` retired.

### Added
- Native shopping assistant (`src/features/assistant/`, docs/assistant.md, ADR-0008), **disabled by
  default and compiled out** of publishable builds (`NEXT_PUBLIC_ASSISTANT_ENABLED`, guarded by
  `npm run check:assistant-disabled`). Talks to `pequeverso-assistant-api` on its own HTTPS origin;
  verified only against the fixture API (`npm run test:e2e:assistant`). Activation is not authorized.
- Scoped page-motion hold (`src/motion/motion-hold.ts`) used by covering surfaces.

### Changed
- Branch flow: `develop` is the integration branch (default, nightly target); features squash into it,
  releases merge `develop` → `main` with a merge commit (main deploys), hotfixes go to `main` and are
  merged back. Both branches are protected rulesets (`ci` + `Branch policy`).

### Changed
- Whole-site redesign "universo evolucionado" (docs/specs/redesign-universo.md): aurora gradient
  surfaces (cream, sky and blue to white), glass, larger type and radii, float/marquee/shine/
  scroll-progress motion. The Grafismo Fonético landing is a product page (gallery + buy box,
  age as a variant, trust row, detail accordions, bento of the kit and its bonuses); the home is a
  storefront hub; post-purchase, thanks, support, legal and 404 pages rebuilt on the same system.
  Floating glass header with scroll progress, full-height mobile menu, floating mobile buy bar with
  product thumbnail, navy nebula footer.

### Added
- Interactive "Une las sílabas" playground, drifting wall of real pages, product-style page gallery.
- Ten transparent cutouts (`gf.cutout.*`) and ten lifestyle scenes (`gf.life.*`), AI-generated
  and labelled "Imagen ilustrativa." where people are the subject.
- Store blocks: ProductBadge, PriceTag, TrustRow; Card glass/elevated/gradient; FAQ lines variant.

### Changed
- Legal pages re-anchored to the Argentine seller (Gonzalo Martín Pérez, CUIL, Bahía Blanca):
  privacy under Ley 25.326 with the AAIP notice (Res. AAIP 14/2018), consumer terms under Ley
  24.240 and the CCyC, a consumer-protective jurisdiction clause (CCyC 1109, 2654, 2655), numbered
  sections and consistent defined terms; Spanish-only anchors (LSSI, AEPD, RDL 1/2007) removed.
  Seller identification in the footer. No placeholders remain (docs/legal-checklist.md).
- Demo videos approved as owner illustrative footage (some AI-generated), captioned "Video ilustrativo.".

### Added
- `/arrepentimiento/` and the footer link "Botón de arrepentimiento" (Disp. SSDCyLC 954/2025):
  email or refund.hotmart.com, no registration, request code within 24 h, plus a per-country
  consumer-rights reference (`content/es/legal/consumer-rights.ts`, unit-tested).

### Changed
- Design system rebuilt on Tailwind CSS 4.3 + shadcn/ui (Base UI, `base-vega`): one token file
  (`src/app/globals.css`, OKLCH), shadcn primitives in `src/components/ui`, server blocks in
  `src/components/blocks`, kebab-case layout with a Base UI sheet for mobile navigation,
  `motion.css` + WAAPI section entrances, and a lazy three + gsap starfield with a static SVG
  fallback and pause control (`src/motion/scene`, budgeted by `check:scene`). Responsive contract
  enforced by `tests/e2e/responsive.spec.ts`. ADR-0006.

### Added
- Meta Conversions API relay: the browser posts every pixel event (same UUID id) to the
  same-origin `POST /api/meta/events/`, served by `server/meta-capi.mjs` in both Node targets
  (static server and a standalone-only route handler) and forwarded to Graph API with
  `client_ip_address`, `client_user_agent`, `fbp`, `fbc`. One server-only variable,
  `META_CAPI_ACCESS_TOKEN`; empty = 204, Meta never called. Rejecting stops both channels and
  expires `_fbp`/`_fbc`. ADR-0005.

### Fixed
- Conversions API relay on the Hostinger Node app: Next's standalone server is started by the
  host preset, so the relay is now a standalone-only route handler
  (`src/app/api/meta/events/route.standalone.ts`, gated by `pageExtensions`) over a
  transport-agnostic core in `server/meta-capi.mjs`. Canonical path `/api/meta/events/` (the
  slash-less form got Next's 308 then a 404). The front proxy `server/front.mjs` was removed.

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
