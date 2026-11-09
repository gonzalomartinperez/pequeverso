# Audit: measured baseline (2026-11-09)

Subject: `pequeverso` `origin/develop` `cbf519c` (2026-10-19) for source checks; live `https://pequeverso.com` build `cf61f20` for Lighthouse, axe and browser checks. Evidence files were copied from the measured audit into `audit/` in this folder (paths below are relative to this plan). Lighthouse 12 runs: mobile emulation (Moto G Power 2022 profile, 412 px, simulated 4G, 4x CPU), `n = 3` per route and form, HeadlessChrome 157.

## 1. Numbers

| Area | Measurement | Result | Evidence |
|---|---|---|---|
| Install | `npm ci` | 235 s (cold) | `audit/time-npm-ci.txt` |
| Lint | `biome ci --error-on-warnings` | 0 findings, 1 s | `audit/repo-checks/lint.log`, `timings*.txt` |
| Types | `next typegen && tsc` (TS 7) | 0 errors, 8 s | `audit/repo-checks/typecheck.log` |
| Unit tests | `node --test` incl. architecture contracts | 277/277 pass, 22 suites, 9.8 s | `audit/repo-checks/test-coverage.log` |
| Coverage | node test coverage | lines 96.19, branches 88.11, funcs 92.78 | `audit/repo-checks/coverage.log` |
| Dead code | knip (full and production) | clean | `audit/repo-checks/knip*.log` |
| Build | `next build --webpack` export | 61 s | `audit/repo-checks/timings2.txt` |
| Bundle budgets | `check:bundle` gzip | all routes within budget; `/` JS 156.3 of 156.5 KB (0.2 KB headroom); product pages JS 174.5 of 187.9 KB | `audit/repo-checks/check-bundle.log` |
| Scene budget | `check:scene` | pass (cap 250 KB; 177.6 KB recorded in docs) | `audit/repo-checks/check-scene.log` |
| Media budget | `check:media` | pass | `audit/repo-checks/check-media.log` |
| JS/MJS/CJS tracked | `git ls-tree` | 1 file: `next.config.mjs`; `src/shared/styles/cn-tables.js` is generated and gitignored | `file-index.csv` |
| Repo weight | tracked bytes | 77.4 MB: visual baselines 31.2 MB (12 PNG), `public/media` 23.0 MB (317), `docs/verification` 20.1 MB (98) | `file-index.csv` |

Lighthouse mobile (median of 3; `audit/lighthouse-summary.md`):

| Route | Perf | A11y | Best practices | SEO | LCP | TBT | CLS | JS transfer |
|---|---|---|---|---|---|---|---|---|
| `/` | 55 | 100 | 79 | 92 | 4.4 s | 2.1 s | 0 | 415 KB |
| `/grafismo-fonetico/` | 31 | 100 | 79 | 92 | 10.1 s | 6.6 s | 0 | 600 KB |
| `/grafismo-fonetico/gracias/` | 54 | 100 | 79 | 61 (noindex) | 4.6 s | 2.0 s | 0 | 395 KB |
| `/imprime-y-juega/` | 49 | 97 | 79 | 61 (noindex) | 5.0 s | 4.2 s | 0 | 1,461 KB |
| `/terminos/` | 54 | 100 | 79 | 58 (noindex) | 4.3 s | 2.0 s | 0 | 391 KB |

Desktop: home 54, product 58, upsell 64, terms 80 (all A11y 97-100). Cumulative layout shift is 0 everywhere. Server response is fast (root document 190 ms home, 90 ms product), so the problem is main-thread and third-party, not hosting latency.

Third parties on the live home page (Lighthouse `third-party-summary`): Facebook 209 KB transferred and 2,112 ms blocking time (`fbevents.js` 114 KB, signals config 95 KB); Cloudflare Insights beacon 10 KB (not documented in `/cookies/` or the CSP). `/imprime-y-juega/` adds Hotmart 747 KB, Google Tag Manager 361 KB, `awswaf.com` 271 KB (inside Hotmart's widget), Facebook 2,925 ms blocking.

Accessibility (axe, 6 routes x mobile and desktop (five clean routes listed plus `/imprime-y-juega/`), `audit/playwright-results.json`): 0 violations on `/`, `/grafismo-fonetico/`, `/grafismo-fonetico/gracias/`, `/terminos/`, `/soporte/`; **2 serious on `/imprime-y-juega/`** (both viewports): `frame-title` (an `iframe` without accessible name) and `link-name` (a link inside the iframe), both from the Hotmart widget container.

Responsive: no horizontal overflow at 320, 390, 768, 1024, 1440, 1920 on five routes; Firefox 390 no overflow. The WebKit iPhone 15 profile failed to take a full-page screenshot (page height x DPR 3 above 32,767 px), a harness limit, not an app defect (`audit/webkit-result.txt`).

Keyboard: skip link first, "Botón de arrepentimiento" second (193 x 24 px), focus indicator present on all 59 recorded tab stops of the home page; the primary Hotmart link is not reachable on the home page (by design, hub).

CRO scan (`audit/playwright-results.json` key `cro`): home above the fold at 390 x 844 holds the h1 "Un pequeño universo para cada etapa.", two product doors, the affiliate disclosure and **the consent banner (fixed, with Aceptar, Rechazar, Configurar)**; no purchase CTA; price `US$14,99` appears in the doors; `reviews: false`; guarantee text present; 7 FAQ items. Product page above the fold has the "Comprar · US$14,99" link.

Security headers (live, from config and owner measurement): HSTS `max-age=300`; CSP report-only with `'unsafe-inline'`; `/_next/static` served with a 4-hour cache although `config/edge-rules.json` says one year immutable.

Field data: **not measurable**. PageSpeed Insights returned HTTP 429 for both URLs (`audit/psi/`). CrUX is likely empty at current traffic.

## 2. Findings

### P0 (production harm or legal exposure)

| ID | Finding | Evidence | Lens |
|---|---|---|---|
| F-01 | Meta Pixel is loaded at first paint before any choice: `DEFAULT_CHOICE` grants `analytics` and `marketing` (owner decision 2026-09-14); the banner sits on top of the hero at the same time. `docs/tracking.md` itself says opt-out does not meet prior-consent criteria. The pixel costs 209 KB and 2.1 s main thread on the home page and sets a third-party cookie (Lighthouse `third-party-cookies` and `inspector-issues` score 0) | `audit/lighthouse/_home_mobile_1.json` (`third-party-summary`, `inspector-issues`); `src/features/tracking/adapters/consent.ts` lines 12-20; `docs/tracking.md` "Consent (opt-out)" | D5, C7 |
| F-02 | Live mobile performance contradicts the docs: product page 31 (LCP 10.1 s, TBT 6.6 s), home 55, upsell 49 versus `docs/performance.md` "100, LCP 699 ms". Hot spots on the product page: main-thread work 21.7 s, bootup 7.3 s; scene and framework chunks (`b536a0f1` 85 KB, `794-*` 68 KB with 3.1 s scripting in the profile) plus the pixel. Hypothesis: the deferred 3D scene mounts inside the Lighthouse window and, with the pixel, saturates a 4x CPU. To verify in M3 with a trace (`performance_start_trace`) | `audit/lighthouse/_grafismo-fonetico__mobile_1.json` (`bootup-time`, `mainthread-work-breakdown`) | D6, C4 |
| F-03 | The Hotmart guarantee is one global 7 days (`config/commerce.ts`, owner fact: Hotmart allows only one); longer legal windows (Spain/EU 14, Argentina and Chile 10 days) are honored by email with manual refunds, but that process is not published or single-sourced in config, and `docs/legal-checklist.md` owner action 2 still reads as a Hotmart setting to change (PV-D2 resolved: document and publish the process, M3-8). The severity is the unpublished withdrawal process, not the 7-day guarantee, which is the owner's fixed Hotmart setting (OD-50). Chile's Ley 21.719 applies from 2026-12-01 (a postponement bill is pending) | `docs/legal-checklist.md`; [07] section 10 | C7 |

### P1

| ID | Finding | Evidence |
|---|---|---|
| F-04 | The CI performance gate cannot see the live problem: Lighthouse CI measures a local static export without the pixel (nightly builds with no pixel on purpose) and perf, LCP and TBT assertions are `warn`; `uses-responsive-images`, `unused-javascript` and `csp-xss` are off. Result: green CI with live 31-55 | `lighthouserc.json`; `docs/deployment.md` table; `.github/workflows/nightly.yml` |
| F-05 | Home has no purchase action above the fold at 390 x 844 and an abstract promise ("Primeras letras o primeras comidas. Encuentra el recurso para su etapa."); the consent banner takes first-viewport space | `audit/playwright-results.json` `cro[0]`; [13] section 1.2 |
| F-06 | `/imprime-y-juega/` has 2 serious axe violations (frame-title, link-name) from the Hotmart iframe and weighs 1,461 KB JS (third party 1.4 MB of it) | `audit/playwright-results.json` `axe` |
| F-07 | Headers: HSTS 300 s; CSP report-only with `'unsafe-inline'`; `/_next/static` cache 4 h in production versus immutable in config (drift between config and the Hostinger or Cloudflare layer; cause unverified); Cloudflare Web Analytics beacon injected and not documented | `config/edge-rules.json`; Lighthouse `uses-long-cache-ttl`, `inspector-issues` |
| F-08 | Home JS budget has 0.2 KB headroom (156.3 of 156.5 KB gz) and the product page is 174.5 KB gz, above the ecosystem first-load target of 170 KB | `audit/repo-checks/check-bundle.log` |
| F-09 | Dependabot configuration allows up to 4 PRs per week (two npm groups, tools/media, actions) and 3 are open now (#148, #149, #150): violates the single weekly PR rule | `.github/dependabot.yml`; `gh pr list` 2026-11-09 |
| F-10 | Docs and ADRs drift from reality: AGENTS.md and ADR-0001 say static export is the default; production is the standalone Node app (since 2026-10-13); README has 8 badges and long assistant sections (template: 3 badges); `SECURITY.md` points to an old-domain mailbox (on the retired `digitalproductsteam.com` domain) | `AGENTS.md`; `docs/decisions/ADR-0001-hosting-target.md`; `SECURITY.md` |
| F-11 | Test depth gaps against the catalog: no mutation, no diff-coverage gate, no property-based tests, no frame-time or INP gate, no structured-data validation, no header snapshot test, WebKit PR project uses a Desktop Safari profile on three specs only, no ZAP baseline | `package.json`, `playwright.config.ts` |
| F-12 | Supply chain gaps: no SBOM, no CodeQL workflow (the doc says it is an owner toggle), no Scorecard, no dependency-review step, no release automation (CHANGELOG is hand-written), no `security.txt`, community files incomplete (no CODE_OF_CONDUCT, SUPPORT, issue forms) | `.github/` tree |
| F-13 | No proof content: no reviews, no named photo evidence beyond the creator note, no free sample; the proof slot does not exist | [13] section 4.4; audit CRO scan `reviews: false` |

### P2

| ID | Finding | Evidence |
|---|---|---|
| F-14 | Sitemap has 3 URLs (`/`, `/grafismo-fonetico/`, `/soporte/`; consistent with the route table) and `lastModified` is the build time for every URL, not a content date; no content that targets real queries | `src/app/sitemap.ts`; [07] section 7 |
| F-15 | JSON-LD uses `JSON.stringify` without escaping `<` (Next docs recommend escaping); Product and Offer exist, Organization exists on home, no `WebSite` | `src/views/product/core-landing-view.tsx` lines 93-95; `src/views/home-view.tsx` lines 47-49 |
| F-16 | Repository weight 77 MB with 31 MB of visual baselines (single PNGs up to 7.3 MB) and 20 MB of evidence screenshots under `docs/verification` | `file-index.csv` |
| F-17 | Three CSS Modules remain (`assistant`, `page-wall`, `playground`) next to Tailwind tokens; tokens are inline in `globals.css`, not DTCG | `file-index.csv` |
| F-18 | Complexity is not measured; there is no ratchet file; `tests/unit/tracking.test.ts` and `tests/browser/tracking.spec.ts` encode the opt-out policy and assert "no banner on the public build" while production runs with a configured pixel (the tested configuration and the deployed configuration differ) | `docs/tracking.md` Tests section |

### Strengths to keep (evidence)

TypeScript 7 strict with `exactOptionalPropertyTypes` and `erasableSyntaxOnly`; architecture test with negative fixtures and no baseline; CI fail-closed aggregate (`ci` bridge) with SHA-pinned actions, zizmor and gitleaks; media pipeline with provenance manifest; typed registry with Zod; commercial facts in config with tests (`content-invariants`, `commerce`); assistant compiled out of publishable builds and verified (`check-assistant-disabled`, `assistant-disabled.spec.ts`); responsive and 200% text-zoom specs; no CLS; Hotmart hand-off with parameter allowlist and `sck` per position.

## 3. Component and flow inventory

| Surface | Components | Notes |
|---|---|---|
| Routes | `/` hub, `/grafismo-fonetico/` (conversion), `/imprime-y-juega/` (post-purchase upsell/downsell, noindex), `/grafismo-fonetico/gracias/`, six legal routes, `/soporte/`, `/alimentacion-bebe/` (302 to affiliate link when configured), 404, `error`, `global-error` | `docs/architecture.md` route table |
| Purchase flow | `CheckoutLink` (positions header, hero, mid, final, sticky), `StickyCTA`, `DecisionLink`, `HotmartWidgetSlot`, `OfferModeRoot` | Hotmart owns InitiateCheckout and Purchase |
| Measurement | `features/tracking` (Meta pixel + CAPI relay, consent), `features/site-analytics` (opt-in, default off, needs API) | |
| Assistant | `features/assistant` (domain, application, adapters, presentation), compiled out | Activation not authorized |
| Design system | `shared/ui` (12 primitives on Base UI plus 2 variant files), `shared/editorial` (24 files), `shared/motion` (16 files plus 3D scene), `shared/identity` | tokens in `src/app/globals.css` |
| Quality tooling | 22 top-level files in `tools/`, unit tests (277 tests in 22 suites), 21 browser specs, 6 assistant specs, 7 workflows | |

## 4. What could not be measured

- Field Core Web Vitals (PSI quota, low traffic); INP and long animation frames (no lab spec exists); real Instagram in-app browser behaviour.
- Real Hotmart checkout per country (owner-only, PV-D10).
- Legal sufficiency (counsel).
- Mutation score, diff coverage, flake rate over 30 days, cyclomatic complexity (no tooling today).
- WebKit on a real iPhone (monthly real-device check does not exist yet).
- Effect of removing the pixel and the scene on the live scores (planned experiment in M3: same Lighthouse protocol before and after, recorded in `progress.md`).
