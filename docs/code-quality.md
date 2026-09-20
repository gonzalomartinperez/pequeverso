# Code quality

## Standard

TypeScript strict with `noUncheckedIndexedAccess`; Server Components by default and client
islands only where the browser is required; one component per folder with its CSS Module; design
tokens only (no magic numbers in component CSS); concise JSDoc on exported symbols, no narrative
comments; no dead code (knip is a gate); business facts come from `config/` and `src/products`.

## Gates

| Gate | Tool | Runs on | Blocking |
|---|---|---|---|
| Format + lint | Biome 2.5 (`biome ci --error-on-warnings`), `next`/`react` domains | PR, main | yes |
| Types | `next typegen` + `tsc --noEmit` | PR, main | yes |
| Unit | `node --test`: edge rules ↔ golden `.htaccess`, checkout params, commerce facts, media manifest, content invariants (retired names, outcome claims, placeholders, guarantee days, price format) | PR, main | yes |
| Dead code | `knip --production` (PR/main), full `knip` (nightly) | PR, main, nightly | yes |
| Build | static export; generated golden files committed | PR, main | yes |
| Media | manifest record per file, ≤ 5 MB/file, total budget, `--strict` rights gate on deploy | PR, main, deploy | yes |
| Bundle | gzip per route vs `config/budgets.json` (html/js/css) | PR, main | yes |
| Rendered HTML | `scripts/check-rendered.mjs`: landmarks, single visible h1, `lang`, canonical, skip link, resolvable anchors, no placeholders or retired text | PR, main | yes |
| Placeholders | report on PR; `--strict` on deploy | PR / deploy | deploy |
| Dependencies | `npm audit --omit=dev --audit-level=high`; Dependabot weekly with cooldowns (npm, `tools/media`, actions incl. `.github/actions/*`) | PR, main | yes |
| Workflows | `actionlint` (with shellcheck) + `zizmor` (`.github/zizmor.yml`) on every workflow and composite action | PR, main | yes |
| E2E | Playwright `PW_SET=pr`: chromium 390/768/1440 + reduced motion (smoke, axe WCAG 2.2 AA, offer modes, widget lifecycle, commerce, consent, motion, navigation) | PR | yes |
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
| `ci.yml` (pull request) | PR, `workflow_dispatch` | workflows ≈ 0:20 · build ≈ 0:45 · e2e ≈ 3:30 · lighthouse ≈ 2:15 · ci | ≈ 4:30–5:00 | ≈ 7 |
| `ci.yml` (push to main) | push | workflows · build · ci (e2e/lighthouse skipped) | ≈ 1:10 | ≈ 1.5 |
| `post-deploy-verify.yml` | push to main, `workflow_dispatch`, called by Deploy | verify (wait for Hostinger ≈ 1–3 min, smoke, headers, `PW_SET=prod`, Lighthouse) | ≈ 3:00 | ≈ 3 |
| `nightly.yml` | 04:17 UTC, `workflow_dispatch` | build ≈ 0:40 · chromium ≈ 6:30 · webkit ≈ 11:00 · visual ≈ 1:10 · clean-clone ≈ 1:00 · quality ≈ 5:00 | ≈ 12:00 | ≈ 26 |
| `deploy.yml` | manual, environment approval | release ≈ 2:00 + verify | ≈ 5:00 | ≈ 5 |
| `branch-policy.yml` | `pull_request_target` (no checkout, no permissions) | 1 shell step | ≈ 0:10 | < 0.5 |

Concurrency: a newer commit on the same pull request cancels the older CI run; pushes to `main`,
nightly and deploy runs are never cancelled. Artifact retention: PR export 3 days, Playwright
reports 7 (14 nightly), Lighthouse reports 30. Lint the workflows locally with
`actionlint` and `zizmor --persona=pedantic .github/` (binaries, no npm dependency).

## Local commands

`npm run check` reproduces the build job. `npm run test:e2e` runs the PR set; `test:e2e:nightly`,
`test:e2e:visual` and `test:e2e:prod` (with `E2E_BASE_URL`) select the other sets. `npm run
analyze` writes bundle reports under `.next/analyze`.

Commits follow Conventional Commits with a body that states what was verified and what was not.
