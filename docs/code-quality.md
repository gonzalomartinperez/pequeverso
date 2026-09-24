# Code quality

## Standard

TypeScript strict with `noUncheckedIndexedAccess`; Server Components by default and client
islands only where the browser is required; Tailwind utilities over the tokens in
`src/app/globals.css` (kebab-case files, `data-slot` roots, cva variants; CSS Modules only for
custom geometry, never with `@apply`; see `docs/design-system.md`); concise JSDoc on exported symbols, no narrative
comments; no dead code (knip is a gate); business facts come from `config/` and `src/products`.

## Gates

| Gate | Tool | Runs on | Blocking |
|---|---|---|---|
| Format + lint | Biome 2.5 (`biome ci --error-on-warnings`), `next`/`react` domains | PR, main | yes |
| Types | `next typegen` + `tsc --noEmit` | PR, main | yes |
| Unit | `node --test`: edge rules ↔ golden `.htaccess`, checkout params, commerce facts, media manifest, content invariants (retired names, outcome claims, placeholders, guarantee days, price format), design-system invariants (no `@apply` in modules, no retired style paths, kebab-case + `data-slot`, light-only, OKLCH contrast pairs), scene-budget plugin | PR, main | yes |
| Dead code | `knip --production` (PR/main), full `knip` (nightly) | PR, main, nightly | yes |
| Build | static export; generated golden files committed | PR, main | yes |
| Media | manifest record per file, ≤ 5 MB/file, total budget, `--strict` rights gate on deploy | PR, main, deploy | yes |
| Bundle | gzip per route vs `config/budgets.json` (html/js/css) | PR, main | yes |
| Scene | `scripts/check-scene-budget.ts`: the three + gsap closure is never initial and ≤ `scene.js` (250 KB) | PR, main | yes |
| Rendered HTML | `scripts/check-rendered.ts`: landmarks, single visible h1, `lang`, canonical, skip link, resolvable anchors, no placeholders or retired text | PR, main | yes |
| Placeholders | report on PR; `--strict` on deploy | PR / deploy | deploy |
| Dependencies | `npm audit --omit=dev --audit-level=high`; Dependabot weekly with cooldowns (npm, `tools/media`, actions incl. `.github/actions/*`) | PR, main | yes |
| Workflows | `actionlint` (with shellcheck) + `zizmor` (`.github/zizmor.yml`) on every workflow and composite action | PR, main | yes |
| Hostinger parity | `rockylinux:8` (GLIBC 2.28) container: WASM SWC fallback asserted, `build:standalone`, smoke against `npm start` | PR, main | yes |
| E2E | Playwright `PW_SET=pr`: chromium 390/768/1440 + reduced motion (smoke, axe WCAG 2.2 AA, offer modes, widget lifecycle, commerce, consent, motion, navigation, responsive contract 320–1920 in the 1440 project) | PR | yes |
| Lighthouse | LHCI on the export, 2 runs, mobile emulation; a11y ≥ 0.95 and CLS ≤ 0.1 are errors; report kept as artifact and job summary | PR | a11y/CLS |
| Production | `post-deploy-verify`: revision match, smoke, headers, `PW_SET=prod`, informative Lighthouse | main push, deploy | yes |
| Nightly | 7 widths × Chromium/WebKit, visual snapshots (`tests/e2e/visual.spec.ts`, Linux baselines under `tests/e2e/__screenshots__`, regenerate with the `update_snapshots` input), clean-clone invariant, knip, LHCI ×5, link check, bundle analysis | nightly | report |

Lab numbers (Lighthouse) are not field numbers; real-user Core Web Vitals come from Search
Console / CrUX after launch.

## Workflows and cost

Measured on `ubuntu-24.04` runners (September 2026, run ids in the commit bodies). Every job
declares `timeout-minutes`, per-job `permissions` (workflow default `permissions: {}`) and shares
`.github/actions/setup` (Node from `.nvmrc` + npm cache + `npm ci` + optional Playwright browser
cached per version). Nightly runs on `main` and therefore warms the browser caches pull requests
restore (caches created on a PR branch are invisible to other branches).

| Workflow | Trigger | Jobs | Wall time | Billed minutes |
|---|---|---|---|---|
| `ci.yml` (pull request) | PR, `workflow_dispatch` | workflows 0:17 · build 0:50 · hostinger 1:50 · e2e 3:25 · lighthouse 2:20 · ci | 5:05 (run 35535556322) | ≈ 9 |
| `ci.yml` (push to main) | push | workflows · build · hostinger · ci (e2e/lighthouse skipped) | ≈ 2:00 | ≈ 3 |
| `post-deploy-verify.yml` | push to main, `workflow_dispatch` (`sha`), called by Deploy | verify: wait for Hostinger (≈ 1–3 min after a push), smoke, headers, `PW_SET=prod`, Lighthouse | 1:10 once live (run 35536094502) | ≈ 2 |
| `nightly.yml` | 04:17 UTC, `workflow_dispatch` (`update_snapshots`) | build 0:49 · chromium 6:13 · webkit 11:04 · visual 1:57 · clean-clone 0:49 · quality 5:00 | 10:14–12:01 (runs 35535185028, 35944132257) | ≈ 26 |
| `production-daily.yml` | 09:00 UTC (06:00 Buenos Aires), `workflow_dispatch` | revision 0:03 · verify (reused post-deploy-verify) 1:10 · live checks 0:14 · report 0:07 | 1:29 (run 35944174387) | ≈ 2 |
| `deploy.yml` | manual, environment approval | release ≈ 2:00 + verify | ≈ 5:00 | ≈ 5 |
| `branch-policy.yml` | `pull_request_target` (no checkout, no permissions) | 1 shell step | ≈ 0:10 | < 0.5 |

## Daily cadence

Two scheduled workflows, both reporting in their job summary:

1. **Nightly (04:17 UTC, code on `main`)** — the export at seven widths on Chromium and WebKit
   (functional set), visual baselines, the clean-clone invariant (no pixel id → no banner, no
   cookies), full knip, Lighthouse ×5, internal link check of `out/`, bundle analysis. The Hostinger
   parity lane is not repeated here: it already gates every PR and every push to `main`. When
   `tests/e2e/responsive.spec.ts` lands, add `responsive` to `specs.functional` in
   `playwright.config.ts` and it joins the nightly matrix automatically.
2. **Production daily (09:00 UTC, the live site)** — never builds. Reads the live sha from
   `build-info.json`, reuses `post-deploy-verify.yml` (smoke, headers, `PW_SET=prod`, informative
   Lighthouse) and runs `scripts/check-live.ts`: TLS certificate ≥ 14 days, header matrix (HSTS,
   nosniff, referrer, frame, CSP, HTML `no-cache`, immutable `/_next/static`; `build-info.json`
   `no-store` as a warning), robots and sitemap, Hotmart checkout href on the landing, Conversions
   API relay probe (`POST /api/meta/events/` with `{"events":[]}`: 400 = enabled, 204 = disabled,
   308/404 = relay not deployed → fail), and every internal `href`/`src` on the sitemap pages
   (Cloudflare `/cdn-cgi/` excluded). On failure one issue labelled `production` is opened (or
   commented on); the next green run closes it. Run it any time with
   `gh workflow run production-daily.yml`.

Concurrency: a newer commit on the same pull request cancels the older CI run; pushes to `main`,
nightly and deploy runs are never cancelled. Artifact retention: PR export 3 days, Playwright
reports 7 (14 nightly), Lighthouse reports 30. Lint the workflows locally with
`actionlint` and `zizmor --persona=pedantic .github/` (binaries, no npm dependency).

## Local commands

`npm run check` reproduces the build job. `npm run test:e2e` runs the PR set; `test:e2e:nightly`,
`test:e2e:visual` and `test:e2e:prod` (with `E2E_BASE_URL`) select the other sets. `npm run
analyze` writes bundle reports under `.next/analyze`.

Commits follow Conventional Commits with a body that states what was verified and what was not.
