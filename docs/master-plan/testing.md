# Testing

Layers and numeric targets for a public store site (ecosystem section 11.1, "Public site" column), mapped row by row to the test catalog of section 11.0. Pragmatism rule: a type is kept only where it guards a real risk of this repo (static site, Hotmart hand-off, consent, speed, accessibility, copy facts). Baseline numbers come from `audit.md`: 277 unit tests, branch coverage 88.11, knip clean, 21 browser specs.

## 1. Targets by layer

| Layer | Target | Baseline | Gate |
|---|---|---|---|
| Static | 0 lint errors and warnings (Biome), 0 type errors (TS 7, tsc as its own job) | 0 / 0 | PR |
| Test mix (share of count) | 25% unit / 30% integration / 35% E2E / 10% non-functional | roughly 277 unit, 21 browser specs; integration mostly inside unit tests with real HTTP servers | tracked, not gated |
| Branch coverage floor | repo-wide floor from the ratchet, starting at 88% (standard floor 75%) and target at least 90% | 88.11 | PR (ratchet) |
| Diff coverage | at least 85% on changed lines | none | PR (`diff-cover` on the node coverage lcov) |
| Mutation (scoped) | StrykerJS incremental on PR changed files, break 60; weekly full scoped target 75-80 (high 80, low 65) | none | PR incremental; weekly full |
| Property-based | fast-check, 100 runs on PR and 1000 nightly | none | PR |
| Contract | Consume the committed API snapshots; schema tests | `contracts/assistant-api` tests exist | PR when `contracts/**` changes |
| E2E | 10-20 tagged journeys; PR: Chromium plus iPhone WebKit; nightly and release: Chromium, Firefox, WebKit, iPhone and Pixel profiles | 21 specs, PR projects chromium 390/768/1440, firefox 390 and webkit 390 on three specs | PR, nightly |
| Visual | 6-10 pages x 2 viewports (390 and 1440) in the pinned Playwright image, `maxDiffPixelRatio` 0.01 (today 0.03), animations disabled, fonts ready, reduced-motion variant | 12 PNG baselines, 31.2 MB | nightly, release; affected routes on PR |
| Accessibility | axe WCAG 2.2 AA per route x viewport and key state, 0 serious or critical; keyboard journeys; manual NVDA and VoiceOver per release | 2 serious on upsell | PR |
| Lighthouse (5 runs, median) | perf at least 0.90, a11y 1.0, best practices at least 0.95, SEO at least 0.95 (indexable routes), LCP at most 2500 ms (this site's stricter lab gate: 2000), CLS at most 0.1 (0.05), TBT at most 200 ms, landing JS at most 170 KB gz | live 31-55 | release and nightly; PR on public routes with the production-config build |
| Load | none on PR | n/a | n/a |
| Security | headers and CSP smoke, dependency gate, ZAP baseline nightly | none | PR / nightly |

## 2. Catalog mapping (ecosystem section 11.0, every row)

| Family | Test types | Tool | Scope here | Threshold | Cadence |
|---|---|---|---|---|---|
| Correctness | Unit | `node:test` with type stripping today; the runner is decided by one spike for all four TypeScript repos (DR-09, D-10) | `config/`, `src/features/*/domain`, `commerce`, `tracking`, `playground`, `tools/lib`, content invariants | all pass; coverage ratchet | PR |
| Correctness | Integration with real services | Real HTTP server for the CAPI relay against a fake Graph API (exists in `meta-capi.test.ts`); standalone server smoke (`hosting` job); no database in this repo | relay, edge rules, standalone start | all pass | PR |
| Correctness | Component (all states) | Playwright component-level checks on the dev-only state gallery (section 5) plus existing specs | buttons (all states), notice, banner, sticky bar, widget slot | visual and axe per state | PR (affected) |
| Correctness | Architecture and boundary | Existing architecture test with negative fixtures; new rules in `target-state.md` section 3 | whole `src`, `config`, `content` | 0 violations, empty baseline | PR |
| Test quality | Mutation | StrykerJS: first candidate `tap-runner` on `node:test` (E7 spike, 1-2 days; also TS 7 checker alias until 7.1) | `config/products/schema.ts`, `src/features/commerce/domain/checkout-url.ts`, `src/features/tracking/adapters/consent.ts` and `src/features/consent/domain`, `src/features/playground/domain`, `src/views/seo/*`, `tools/lib/edge-rules.ts`, `src/features/assistant/{domain,application}` | PR break 60; weekly target 75-80; never on UI glue | PR incremental, weekly full |
| Test quality | Branch and diff coverage | node coverage (lcov) plus `diff-cover` | whole repo | floor 88 and rising; diff 85% | PR |
| Test quality | Flake detection | Playwright `--repeat-each=5` on tagged journeys nightly; `failOnFlakyTests` on main and release | browser specs | 0 flaky in required checks over 30 days (rubric D3) | nightly |
| Input space | Property-based | fast-check | checkout URL builder (allowlist, `off` and `ref` never forwarded, `sck` at most 30 characters, idempotent), `formatUsd` (decimal comma, never a point), consent cookie parse and serialize round trip, slug and trailing-slash normalization, edge-rule rendering equals both targets, sitemap generation, syllable game permutation | 100 PR, 1000 nightly | PR, nightly |
| Input space | API and parser fuzzing | Schemathesis | not applicable: the site has no public API of its own; the CAPI relay's validation matrix is covered by example and property tests (fast-check on the request validator) | n/a | n/a |
| Contracts | Producer to consumer schema | JSON Schema or Ajv against `contracts/assistant-api/*` and `contracts/site-analytics/*` (existing contract tests `contract-v1-1`, `contract-v1-4`, `publication`) | snapshots with `source.json` revision and SHA-256 | pass; `contract-major` rule | PR when `contracts/**` changes |
| Contracts | SSE conformance (frames, heartbeat, reconnect), event schemas | Existing assistant fixture specs (`tests/assistant/*`) | assistant client against the pinned API revision | pass | nightly (and when the assistant changes) |
| End to end | User journeys | Playwright | hub door to kit, kit CTA to the Hotmart origin (link, parameters, `sck`; **no fake purchase**), sample download, gallery zoom, FAQ, age selector, playground, legal links, 404, upsell widget with stubbed Hotmart script, consent flow | 10-20 tagged journeys | PR (Chromium, iPhone WebKit), nightly (all engines) |
| End to end | Cross-browser and real device | Playwright projects Chromium, Firefox, WebKit, iPhone 15, Pixel 7; monthly real-device Safari and Instagram in-app check (human) | tagged journeys | pass | nightly; monthly manual |
| Visual | Screenshot regression | Playwright `toHaveScreenshot` in the pinned image | hub, kit (hero and full), upsell, downsell, thanks, support, legal sample, 404, consent banner states, assistant-disabled state, state gallery; 390 and 1440; reduced-motion variant | `maxDiffPixelRatio` 0.01; regions instead of 7 MB full-page shots; repo-size ratchet | nightly, release; affected on PR |
| Visual | Per-figure hero snapshots | n/a | not applicable: no 10-figure hero here (portfolio only); the star scene has a seeded static variant covered by the hero snapshot | n/a | n/a |
| Accessibility | axe, keyboard, focus, reduced motion, zoom, screen reader | `@axe-core/playwright` 4.x tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`; Playwright; existing `text-zoom.spec.ts`; manual checklist | every route x mobile and desktop, key states (banner, menu, dialog, widget error) | 0 serious or critical; focus not obscured; target at least 24 px (44 for primary) | PR; manual per release |
| Performance | Lighthouse and bundle budgets | Lighthouse CI (5 runs, median) on the production-config build (fake pixel id, real third-party hosts allowed) and nightly on the live URL; `check:bundle`, `check:scene`, `check:media` | home, kit, upsell, thanks | section 1 | PR on public routes; nightly live |
| Performance | Animation fluidity (frame time, long animation frames, INP) | Playwright with CDP CPU throttle 4x, rAF sampling, `PerformanceObserver` for `long-animation-frame` and `event` (specs from [13] 2.7) | scroll of hub and kit at 390 x 844 DPR 3, five money interactions, reduced-motion lane | p95 at most 20 ms, p99 at most 33 ms, dropped at most 2%, zero LoAF above 100 ms, interaction at most 150 ms | PR (smoke lane), nightly |
| Performance | RUM field CWV | `web-vitals/attribution` | after MV | p75 LCP 2.5 s, INP 200 ms, CLS 0.1 | continuous (MV) |
| Load and resilience | Load, stress, soak | not applicable on PR: static pages behind Cloudflare; a one-off smoke of the standalone server (k6 or `autocannon`, 50 concurrent for 60 s) before M7 records TTFB p95 and cold-start time | standalone server | TTFB p95 below 800 ms | before release |
| Load and resilience | Dependency-failure tests | Playwright with blocked or failing third parties | Hotmart script blocked (widget notice after 8 s), pixel blocked (no effect), relay 5xx (page unaffected), storage blocked (consent in memory) | page works; no exception | PR |
| Security | SAST | CodeQL default setup (public repo, `javascript-typescript` and `actions`) | whole repo | no new high | PR, weekly |
| Security | Secrets | gitleaks (existing) plus GitHub secret scanning and push protection | full history | 0 | PR |
| Security | Dependency and licence review | `dependency-review-action`; osv-scanner daily; `npm audit --omit=dev` (existing) | npm, Actions | no high without exception | PR, daily |
| Security | Container scan | not applicable: no image is built or deployed by us (Hostinger builds from source) | n/a | n/a | n/a |
| Security | DAST baseline | OWASP ZAP baseline against the standalone server | all routes | no medium or higher | nightly |
| Security | Authz matrix, CSRF, session | not applicable: no authentication or sessions; the relay's `Origin` and rate-limit checks are covered by the existing validation matrix | n/a | n/a | n/a |
| Security | Security headers and CSP | Header snapshot unit test of the rendered `edge-rules.json`; production-daily compares live headers; Playwright asserts no CSP violation reports on journeys | all routes | exact snapshot; live equals snapshot | PR, daily |
| Security | RSC and DTO leak checks | Architecture test: registry and `process.env` never in client graph (existing) plus build scan for forbidden strings (secrets, `META_CAPI`) in `.next` client output | build output | 0 | PR |
| Security | Prompt injection and red team | not applicable here: the assistant lives in the API repo (disabled in the site) | n/a | n/a | n/a |
| AI quality | Golden set, graders, retrieval, judge | not applicable in this repo (API owns it). The site checks only the contract and the disabled state; the activation checklist references the API golden set | n/a | n/a | n/a |
| Data | Migrations, restore drills | not applicable: no database. Seed and fixture safety: media manifest check and placeholder check (existing) | media, legal placeholders | 0 unresolved | PR |
| Build and runtime | Hosting contract and post-deploy | `hosting` job (Rocky 8, GLIBC 2.28, WASM SWC, standalone start and smoke); `post-deploy-verify` (build-info SHA, smoke, headers, prod Playwright, Lighthouse) | production | SHA equals merge SHA | PR, every `main` push, daily |
| Build and runtime | Container structure | not applicable (no image) | n/a | n/a | n/a |
| Infrastructure | Host baseline, Ansible, drift | not applicable (host is Hostinger; the VPS belongs to `vps-ops`) | n/a | n/a | n/a |
| Content and SEO | Copy invariants (also Spain-safe vocabulary list and `lang="es"` with no stray hreflang) | Existing `content-invariants`, `consumer-rights`, `legal-email`, `live-links` tests; add counters and urgency patterns, voseo and regionalism checks (cspell `es` plus a custom word list, LanguageTool offline rules if cheap), "tú" check, price formatter | `content/**`, `config/**` | 0 findings | PR |
| Content and SEO | Structured data, metadata, sitemap, robots, canonical, links | Unit tests with `schema-dts` types and JSON Schema; Playwright metadata assertions; `tools/check-links.ts` (exists) plus lychee for docs | every indexable route | all valid; no `AggregateRating` or `Review` anywhere without a visible review source | PR |
| Time and concurrency | Frozen time | `page.clock` for consent expiry (180-day freshness), banner delay, sticky bar timing; timezone `America/Argentina/Buenos_Aires` already set in Playwright config | consent, widget timeout, banner | pass | PR |
| Time and concurrency | Race conditions | Consent storage failure and double-click on CTA (loading state prevents double hand-off) | `checkout-link`, consent gate | pass | PR |
| Observability | Log redaction, metrics, request id | Relay unit tests assert no token, IP or payload in logs (extend); `/api/health` contract test (`{status, version}`); request id header on the relay response | relay, health | pass | PR |
| Harness | Skill activation evals, docs checks, drift | `check-skills` (existing) plus trigger evals per `skills.md`; standards drift; CI profile coverage test (no file outside every profile) | `.agents/skills/**`, `ci-profile.json` | validation accuracy drop at most 10 points; 100% file coverage | PR (harness profile), weekly |
| Production synthetics | Uptime and journey probes | Existing `production-daily` (TLS, header matrix, relay probe, checkout link, sitemap, internal links) plus read-only Playwright smoke; Uptime Kuma at MV | live site | green; one issue on failure | daily; continuous at MV |

## 3. Runner and mutation decision (E7 outcome for this repo)

Unit tests stay on `node:test` (277 tests in about 10 s, type stripping, no transform step). The spike (M2, 1-2 days): StrykerJS with `tap-runner` on `node:test` and the TypeScript checker under TS 7 (alias to TS 6 until 7.1), measuring incremental run time on a typical PR. If the spike fails, migrate only the scoped modules' tests to Vitest 4 (Stryker's best-supported runner), keeping `node:test` for tools. Decision recorded in ADR-0015.

## 4. Flake policy

Ecosystem section 6.3 applies: no blanket retries on unit tests; Playwright `retries: 1` on CI (nightly keeps 2 until the first month of data); a pass on retry is recorded as flaky; quarantine tag and issue the same day; fix or delete in 7 days; cap 2% of tests or 5. Playwright WebKit is not Mobile Safari: monthly real-device Safari smoke.

## 5. State gallery for tests

A dev-only route `/_design` exists only when `NEXT_PUBLIC_DESIGN_GALLERY=true` at build time (same fold-away mechanism as the assistant flag); a check script asserts the route and its code are absent from every publishable artifact. It renders every button treatment x state, notice, banner variant, sticky bar, widget states and the empty/error views, so visual and axe tests cover states without bespoke fixtures.

## 6. Test data and safety

Fake Hotmart offer `https://pay.hotmart.com/TEST0000000?checkoutMode=10` and a fake pixel id only; third-party hosts stubbed in `tests/browser/fixtures.ts` except in the dedicated "real third-party cost" Lighthouse lane (which loads the real Meta script with the fake id and sends no events to a real pixel because the fake id is invalid; confirm this assumption in the M2 task before enabling). Never run browser tests against production with a real checkout; the prod project only checks smoke and headers.
