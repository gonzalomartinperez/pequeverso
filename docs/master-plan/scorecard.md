# Scorecard

Rubrics: `rubrics.md` (ecosystem v2, frozen). Baseline date 2026-11-09, `develop` `cbf519c`, live `cf61f20`. Scores below are the planner's provisional baseline applied to the rubric's own rule ("a criterion without evidence is unmet; any unmet critical criterion caps the axis below 85"). They replace the provisional ranges in `owner-decisions.md` (dev 85-88, design 85, CRO 70-78), which were set before the rubric was frozen. The first independent evaluator re-score happens at M3 and its result supersedes this table.

Target: at least 95 on every axis. Floor 90 only where an unauthorized input blocks it (stated per axis). Scores never compensate across axes. A failing required check caps a lens at 70; a committed secret caps Security at 40.

## 1. Baseline, target and measurement

### Lens 1 - Senior developer

| Axis | Baseline | Evidence (see `audit.md`) | Critical criteria unmet today | Target | Automatic measurement | Ratchet file |
|---|---|---|---|---|---|---|
| D1 Architecture | 88 | Architecture test with negative fixtures, empty baseline, strict client/server graph check; composition root for the assistant only | Guard not run through Biome `noImportCycles`/`noPrivateImports`; consent logic split across `tracking` and `site-analytics`; ADR-0001 contradicts production | 95 | `npm run test:architecture` (existing) plus `guard-violations.json` must equal 0; ADR index check | `ratchets/guard.json` |
| D2 Code quality | 84 | lint 0, types 0 (TS 7 strict), knip clean | Complexity per function not measured or ratcheted | 95 | Biome `noExcessiveCognitiveComplexity` ratchet, `tsc`, knip | `ratchets/complexity.json` |
| D3 Tests | 70 | 277/277; branches 88.11; E2E on 3 browsers | No mutation, no diff coverage, no property-based, no 30-day flake evidence, WebKit PR project is not an iPhone profile | 95 | node coverage + diff-cover, Stryker (scoped), fast-check, Playwright flaky report | `ratchets/coverage.json`, `ratchets/mutation.json` |
| D4 CI/CD | 72 | Fail-closed `ci` bridge, SHA pins, build-once artifact transfer | Not dynamic (affected-only); aggregate is named `ci` not `ci-gate`; 3 open dependency PRs; no release automation | 95 | `ci-profile.json` coverage test; p50/p95 from `gh run list`; weekly guard | `ratchets/ci-duration.json` |
| D5 Security and supply chain | 62 | Pinned actions, zizmor, gitleaks, parameter allowlist, relay input validation | No SBOM, CodeQL, Scorecard, dependency-review; CSP report-only; HSTS 300; pixel before consent; no threat model (STRIDE-lite for the CAPI relay and consent) | 95 (floor 90 if the per-route CSP hash spike fails) | CodeQL, osv daily, zizmor, header snapshot test, Scorecard weekly | `ratchets/security.json` |
| D6 Performance | 52 | Bundle budgets enforced as errors; CLS 0 | Lighthouse thresholds are `warn`; live perf 31-55 against budget; no frame/INP gates | 95 | Lighthouse CI 5 runs median on a production-config build and on the live URL nightly; bundle budgets; frame-time spec | `config/budgets.json`, `ratchets/lighthouse.json` |
| D7 Observability | 55 | `build-info.json`, post-deploy verify, daily production checks, one issue on failure | No health endpoint contract (`/api/health`), no RUM, no error tracking for the relay | 95 (floor 90 for RUM and error tracking until the VPS stack exists, MV) | health contract test, `production-daily` result, RUM ingestion check (MV) | `ratchets/observability.json` |
| D8 Docs and DX | 66 | Strong docs set, ADR-0001..0009, one-command setup | README off template (8 badges, long); ADRs stale; community files incomplete; no release automation; skills not eval-tested | 95 | README heading check, lychee, markdownlint, skills evals, ADR index check | `ratchets/docs.json` |

### Lens 2 - Senior product designer

| Axis | Baseline | Evidence | Unmet critical criteria | Target | Measurement | Ratchet |
|---|---|---|---|---|---|---|
| P1 Visual design and system | 86 | OKLCH `--pv-*` tokens, contrast unit test, fluid type, metric-matched fallbacks | Tokens are not DTCG; no lint for literals outside tokens; 3 CSS Modules | 95 | DTCG build snapshot, contrast build check, literal lint, coral lint | `ratchets/design-lint.json` |
| P2 Interaction and motion | 80 | CSS-first motion, reduced-motion tests, ViewTransition local | No frame-time/INP gate; loading/empty/error states not catalogued for every async view (widget, gallery, playground); button states not specified in full | 95 | frame-time spec, LoAF, state-gallery visual tests, reduced-motion lane | `ratchets/motion.json` |
| P3 Accessibility | 82 | Lighthouse a11y 97-100; axe 0 on five routes; 200% zoom spec | axe 2 serious on `/imprime-y-juega/` (Hotmart iframe); no screen-reader checklist per release | 95 (Lighthouse a11y 100 on every route) | axe per route x viewport, keyboard journeys, manual NVDA/VoiceOver pass at release | `ratchets/a11y.json` |
| P4 Responsive and cross-browser | 90 | 320-1920 no overflow; Chromium, Firefox, WebKit 390; visual baselines | WebKit profile is desktop Safari; baselines are heavy and not in a pinned container | 95 | Playwright projects incl. iPhone WebKit; visual in the pinned image | `ratchets/visual.json` |
| P5 Theme parity | 85 | Single light theme by ADR-0006 | The ADR does not cite the dark-mode evidence; tokens not `light-dark()`-ready | 95 (ADR-0006 amended with evidence, `color-scheme: light`) | ADR confirmation check, token test | n/a |
| P6 Consistency and identity | 90 | Shared primitives, coherent universe identity | Identity gaps listed in the playbook (button states, sticker, sunrise) | 95 | Evaluator agent at each release with screenshot pack | `ratchets/scorecard-axes.json` |

### Lens 3 - Senior e-commerce / CRO (axes C1-C7 defined in `cro.md` section 9)

| Axis | Baseline | Evidence | Target | Measurement |
|---|---|---|---|---|
| C1 Value proposition above the fold (5-second test) | 74 | Product page above the fold has price and CTA; hub h1 is abstract and the banner covers the first viewport | 95 | Evaluator agent with screenshot at 320 x 568, 390 x 844; five-parent test (owner input, optional) |
| C2 Trust signals (real only) | 68 | Honest by construction, but no sample, no named photo proof, withdrawal-by-email process not published; no proof slot | 95 | Content invariants test (no counts, no testimonials without consent record), evaluator |
| C3 Purchase path to Hotmart | 80 | Same-tab handoff, allowlist, `sck` per position, price and guarantee near CTA, sticky bar | 95 (floor 90 until PV-D10 live-checkout evidence exists) | E2E handoff test, link checker, PV-D10 screenshot set |
| C4 Perceived speed (field p75) | 35 | Lab LCP 4.4 s home and 10.1 s product versus 2.5 s | 95 (floor 90 until field data exists: CrUX or RUM) | Lighthouse gates; RUM p75 from MV; CrUX when available |
| C5 Assistant messaging | 90 | Disabled and compiled out, tested; grounding is in the API | 95 (floor 90 while the assistant cannot run live: VPS plus eval spend) | Disabled-state regression, activation checklist file, golden set status from the API repo |
| C6 SEO | 72 | Product+Offer, Organization, canonical, robots, sitemap of 3 URLs | 95 | Schema validation tests, metadata tests, sitemap test, Search Console (owner) |
| C7 Privacy-respecting analytics with consent | 30 | Pixel before consent; opt-out; no cookieless counter; Cloudflare beacon undocumented | 95 (floor 90 if PV-D4 spend is not authorized) | Playwright network assertion: zero third-party requests before an explicit grant; consent flow tests |

Lens minimums at baseline: developer 52 (D6), designer 80 (P2), CRO 30 (C7). All three lenses are below the 70 cap condition because required criteria fail; the M3 gate is therefore "every axis at least 90 with evidence", M6 is "at least 95 or the stated floor".

## 2. Axes that depend on an unauthorized input (floor 90)

| Axis | Blocked by | Offline alternative in the plan |
|---|---|---|
| D7 (RUM, error tracking) | VPS (MV) | Lab frame-time and production synthetics; add a stub `web-vital` event schema now |
| C4 (field p75) | Traffic and RUM ingestion | Lab gates stricter than field targets ([13] 2.6); CrUX check when it appears |
| C5 (live assistant) | VPS, spend, eval labels | Disabled-state tests and a signed activation checklist |
| C7 (cookieless counter) | PV-D4 spend decision | Consent-gated Meta only; counts from Hotmart dashboard |
| C3 (live checkout evidence) | PV-D10 owner phone check | Link and parameter E2E tests |

## 3. Scorecard tooling and ratchets

- `tools/scorecard/` (TypeScript, Node type stripping) reads CI artifacts (Lighthouse JSON, axe results, coverage, Stryker report, guard output, bundle report, network assertions, header snapshot) and writes `scorecard.json`: per-axis inputs and pass or fail per criterion of rubrics v2. Runs nightly and on release; fails on regression against `ratchets/*.json`.
- Ratchet files live in `ratchets/` at the repo root (see `file-index.csv`); they may only tighten. Loosening needs an ADR and owner approval.
- Lighthouse ratchet: perf, LCP, TBT, CLS and JS KB per route, median of 5, on the production-config build (fake pixel id) and on the live URL. The live lane runs after every deploy (`post-deploy-verify`) and nightly.
- New hard invariant (counts as a P0 test): `third_party_requests_before_consent == 0` on every route.
- Judgement axes (P6, C1, C2, C6 partially, C3 evidence) are scored per release by an independent evaluator agent that sees the repo, the evidence pack and the rubric; each score is recorded with screenshots and links in `progress.md`. Quarterly independent re-audit.
- Cadence: nightly scorecard; per-release evaluator pass; weekly ratchet review in the Monday dependency PR; quarterly standards review.
