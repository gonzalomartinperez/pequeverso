# ADR-0004: CI topology — one build per pull request, verification on main

Date: 2026-09-13 · Status: accepted

## Context

The first pipeline ran quality, E2E and Lighthouse on every pull request and again on every push
to `main` (≈12 minutes per change), installed dependencies three times, reinstalled Playwright
browsers on each run, discarded Lighthouse reports, and the nightly job selected Playwright
projects that matched no spec file. Hostinger builds `main` on push, so the merge commit is also
the production build.

## Decision

- `ci.yml`: a single `build` job (Biome, TypeScript, unit tests, `knip --production`, static
  export, media/placeholder/bundle budgets, `npm audit`) uploads the export; `e2e` and
  `lighthouse` run only for pull requests from that artifact, with the Playwright browser cached
  per version. The required status check remains `ci`.
- `post-deploy-verify.yml`: on push to `main` waits until production serves the merged commit
  (`build-info.json`), then runs the smoke suite, header checks, the production Playwright set and
  an informative Lighthouse run. `deploy.yml` reuses it.
- `nightly.yml`: full seven-width matrix on Chromium and WebKit, visual snapshots, the
  clean-clone invariant (no banner, no cookies), full knip, Lighthouse ×5, link check and bundle
  analysis.
- Playwright project sets are selected with `PW_SET` (`pr`, `nightly`, `visual`, `prod`).
- Bundle budgets (`config/budgets.json`) and content invariants are unit-level gates.

## Consequences

- A pull request costs one build plus two short verification jobs (≈5–6 minutes wall); a merge
  costs one build and the production verification.
- Regressions that only show in WebKit or at 1280/1024/430/360 px surface nightly, not on the PR.
- `main` must stay deployable: the ruleset requires branches to be up to date before merging.

## 2026-09-20 hardening

Applied after auditing the five workflows with `actionlint` 1.7.12 (+ shellcheck) and `zizmor`
1.30.1 (`--persona=pedantic`: 24 findings, now 0) and reading GitHub's security-hardening guide,
the zizmor audit catalogue and the 2026 GitHub Actions changelog.

- **Least privilege.** `permissions: {}` at the top of every workflow; each job declares what it
  needs (`contents: read`, or nothing for `ci` and `branch-policy`). `deploy.yml` grants
  `contents: write` only to the `release` job, with the reason next to it. Every `actions/checkout`
  that does not push sets `persist-credentials: false`; the one that pushes carries an explicit
  `zizmor: ignore[artipacked]` justification.
- **No template injection.** Expressions never appear inside `run:`; `matrix.browser`,
  `needs.*.result`, `inputs.*` are passed through `env`.
- **Concurrency.** `ci-${{ github.ref }}` cancels an older run of the same pull request only
  (`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`); `nightly`, `deploy-<target>`
  and deploy-triggered verification never cancel; `post-deploy-verify` cancels only a superseded
  push wait. `timeout-minutes` on every job; `fail-fast: false` on the nightly matrix.
- **Composite action** `.github/actions/setup` (setup-node from `.nvmrc`, npm cache, `npm ci`,
  optional Playwright browser cached by `playwright-<os>-<version>-<browser>`). The nightly jobs use
  it too, which is what makes the browser cache hit on pull requests: the previous key was written
  only by PR branches, so every new branch missed (observed in run 34807820902). `deploy.yml`
  stays inline because it builds the requested tag, which may predate the composite.
- **Workflow lint job** (`workflows`, ≈ 20 s, in parallel with `build`, gates `ci`):
  `raven-actions/actionlint` pinned to actionlint 1.7.12 with shellcheck, and
  `zizmorcore/zizmor-action` pinned to zizmor 1.30.1 in console mode (no SARIF upload, no
  `security-events` permission, GitHub annotations on). Configuration in `.github/zizmor.yml`.
- **Tidy.** Named steps, one workflow-level `env` block per workflow (fake pixel id and
  `E2E_EXPECT_CONSENT` only in `ci.yml`), artifact names without the sha (artifacts are per run),
  retention 3/7/14/30 days (export / PR reports / nightly reports / Lighthouse), job summaries for
  bundle budgets (PR and nightly), Lighthouse (all three producers), production revision and
  headers (`post-deploy-verify`) and the release (`deploy`). `e2e` and `lighthouse` also run on
  `workflow_dispatch`, so a branch can be verified without a pull request. Dead `NEXT_PUBLIC_UMAMI_*`
  variables removed from the deploy build; Dependabot now also watches `.github/actions/*`.
- **Required build values.** The app stops shipping inline business defaults (owner decision,
  2026-09-20; `scripts/check-env.mjs` will fail a build without `NEXT_PUBLIC_SITE_URL` and
  `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO`). `ci.yml` and `nightly.yml` set both at workflow
  level with the public origin and a fake Hotmart offer code; the fake pixel id stays only in
  `ci.yml`, so the nightly clean-clone job keeps proving a pixel-less export. `deploy.yml` reads the
  environment's `vars` at job level (environment-scoped variables do not resolve in workflow-level
  `env`), falls back to the public origin for the site URL and to the fake offer only for
  `staging`; a `production` deploy without a real checkout URL fails before building.
  `post-deploy-verify.yml` does not build and needs none of them.

- **Hostinger parity lane** (`hostinger`, ported from the owner's portfolio CI): `rockylinux:8`
  container pinned by digest, Node from `.nvmrc`, asserts `getconf GNU_LIBC_VERSION == glibc 2.28`
  and that `next/dist/build/swc` loads the WASM bindings (the log shows the native binding failing
  with `GLIBC_2.29 not found`), then `npm run build:standalone` and `scripts/smoke.mjs` against
  `npm start` (10 checks: routes, 308 slash redirect, 404, `build-info.json` sha, one
  `#hotmart-sales-funnel`). It proves what the Ubuntu job structurally cannot — PR #5 (86a4bab) was
  green in CI and failed on the host — and it is the only place the standalone target and the
  Node-mode redirects/headers run at all. About 1:50 in parallel with `build`, shorter than the E2E
  job, so it adds no wall time; it runs on every pull request and push and gates `ci` (a required
  check must not be path-filtered).
- **Whole-tree clean check** after the build (`git diff --exit-code`, from the portfolio): catches
  any generator writing into tracked files, not only `docs/generated`.

### Every step, what it catches, measured cost

Durations from the green dispatched runs 35535556322 (CI), 35535185028 (Nightly) and
35536094502 (post-deploy verify) on 2026-09-20; "caught before" cites real failures in this
repository. `npm run check` is the local mirror of the `build` job; CI runs the same commands as
separate named steps so the failing gate is visible in the job list and each one is timed.

`ci.yml` — required check `ci` = workflows and build and hostinger and (e2e and lighthouse on pull requests)

| Job / step | Catches | Caught before | Cost |
|---|---|---|---|
| workflows · actionlint (+ shellcheck) | invalid YAML/expressions, unknown contexts, unquoted shell | new; a broken snippet fails locally with 3 errors | 2 s |
| workflows · zizmor | template injection, unpinned or vulnerable actions, excessive permissions, credential persistence | new; the baseline had 24 findings | 4 s |
| build · Setup (composite) | — | — | 17 s |
| build · Lint (`biome ci --error-on-warnings`) | style, unused imports, a11y lint rules | runs 34801819186, 34801760805, 34792954517, 34789720759, 34789674042 | 1 s |
| build · Typecheck | type errors, stale route types | no red run yet | 4 s |
| build · Unit tests | commerce facts, content invariants, edge rules vs `.htaccess` golden, checkout params | run 35534303641 (offer-code assertion) | 1 s |
| build · Dead code (`knip --production`) | unused files/exports/deps shipped to production | run 34789581150 | 1 s |
| build · Build static export | build/prerender errors, `check-env` formats | — | 16 s (Next cache hit) |
| build · Tree clean | generators drifting from committed golden files | 7089975 (`.htaccess` dotfile rule) motivated the golden | 0 s |
| build · Media / Placeholders / Bundle / Rendered HTML | media rights and 5 MB / 25 MB budgets; `[[PLACEHOLDER]]` report; gzip per route vs `config/budgets.json`; landmarks, single h1, canonical, anchors | budgets tightened in cd894af (#15); structural checks since d5c6040 (#10) | 0–1 s |
| build · `npm audit --omit=dev --audit-level=high` | known-vulnerable production dependencies | — | 1 s |
| build · Upload export | feeds e2e / lighthouse without a second build | — | 2 s |
| hostinger (see above) | GLIBC 2.28 / WASM SWC / standalone / `npm start` | PR #5 (86a4bab) | 1:50 (dnf 31 s, npm ci 15 s, build 35 s, smoke 2 s) |
| e2e · Setup with cached Chromium | — | cache hit on new branches now (`playwright-Linux-1.63.0-chromium` written by nightly on `main`) | 33 s |
| e2e · Playwright `PW_SET=pr` | smoke, axe WCAG 2.2 AA, offer modes, widget lifecycle, commerce, consent, motion, navigation at 390/768/1440 + reduced motion | runs 34789782195, 34718808308 (TypeScript 7 major bump) | 2:44 |
| lighthouse · LHCI 2 runs | a11y >= 0.95 and CLS <= 0.1 as errors; perf/LCP/TBT/byte budgets as warnings | run 34718808308 | 1:54 |
| ci · Evaluate gates | single required status for the ruleset | every red run above | 3 s |

`nightly.yml` — report only (never gates a pull request)

| Job | Catches | Caught before | Cost |
|---|---|---|---|
| build (+ bundle budget summary) | — | — | 51 s |
| matrix chromium × 7 widths | layout/behaviour at 1280/1024/430/360 that the PR set skips | run 34749691820 | 6:22 |
| matrix webkit × 7 widths | Safari-only regressions | runs 35327273382, 34803557699 (led to #23) | 9:13 (WebKit cache now written) |
| visual (2 widths, Chromium) | unintended pixel changes vs committed baselines | baselines regenerated in #22 / #25 | 1:03 |
| clean-clone | banner or cookies appearing without any integration id | consent redesign in #24 | 51 s |
| quality: full knip, LHCI ×5, links, bundle analysis | dev-only dead code, stable lab numbers, broken internal links, chunk composition | run 34749691820 (knip) | 5:13 |

`post-deploy-verify.yml` — after every push to `main` and after Deploy (about 1:10 once the revision is live)

| Step | Catches | Cost |
|---|---|---|
| Wait for revision (`build-info.json`, up to 20 min) | host built a different commit, or nothing | 1 s when already live |
| Smoke (10 checks) | broken routes/redirects/404, missing widget container | 8 s |
| Headers | HSTS, nosniff, CSP, cache classes, Cloudflare status | 0 s |
| Playwright `PW_SET=prod` | real-origin smoke spec at 1440 | 18 s |
| Lighthouse (informative, `--no-lighthouserc`) | lab scores of the live origin in the job summary | about 1 min |

### Before / after

| | Before (de93077) | After |
|---|---|---|
| PR wall time | 4:29 (run 34807820902) | 5:05 (run 35535556322; the parity lane runs in parallel, E2E is the critical path) |
| Push-to-main wall time | 1:10 | about 2:00 (parity lane; build alone 0:50) |
| Nightly wall time | 11:50 (run 35501884777) | 10:14 (run 35535185028; cached browsers) |
| Steps per PR | 30 unnamed `run:` steps | 42 named steps, 12 of them in the parity lane and 2 lint steps |
| Playwright browser cache on a new branch | miss (key only ever written by PR branches) | hit (written nightly on `main`) |
| npm cache | hit | hit (all jobs) |
| Workflow permissions | `contents: read` at workflow level; `contents: write` for the whole Deploy workflow | `permissions: {}` + per-job; `contents: write` on one job |
| zizmor findings (pedantic) | 24 | 0 (2 justified inline ignores) |
| Informative Lighthouse in post-deploy verify | failed silently on every run (`out/` missing) | audits the live origin |

### Daily cadence (2026-09-23)

- `nightly.yml` stays code-level on the export (unchanged scope; the parity lane is not repeated
  because it already gates every PR and push). `tests/e2e/responsive.spec.ts` (design-system
  branch) had not landed; adding `responsive` to `specs.functional` puts it in the nightly matrix.
- New `production-daily.yml` for the live origin, measured at 1:29 wall (run 35944174387, target
  < 5 min): `revision` (curl `build-info.json`, 3 s) → `verify` = `post-deploy-verify.yml` via
  `workflow_call` with the live sha and a new `wait_seconds: 60` input (no duplicated smoke /
  headers / `PW_SET=prod` / Lighthouse), in parallel with `live` = `scripts/check-live.mjs` (TLS,
  header matrix, robots/sitemap, checkout href, relay probe, internal-link crawl; 10 s, sparse
  checkout, no `npm ci`) → `report` with `issues: write` scoped to that job, using `gh issue`
  and `GITHUB_TOKEN`: one issue titled "Production daily check failing", label `production`,
  commented on while failing, closed by the next green run. A new workflow cannot be dispatched
  until it exists on the default branch, so it was exercised from the branch with a temporary
  push trigger (removed in the following commit).
- First run found a real defect: the Conversions API relay (#28) answers 404 in production on
  `/api/meta/events/` (308 without the slash); the `PW_SET=prod` relay spec fails the same way and
  so did the post-deploy verification of 20c825a (run 35536194841). Issue #30 was opened by the
  workflow. The live check also warns that `build-info.json` is served without `Cache-Control:
  no-store` in Node mode.

### Sources

- GitHub Docs — Secure use reference / security hardening (least-privilege `GITHUB_TOKEN`,
  pinning to full SHAs, script injection via `env`):
  https://docs.github.com/en/actions/reference/security/secure-use
- GitHub Docs — `permissions`, `concurrency`, `timeout-minutes`, `strategy.fail-fast` (workflow
  syntax): https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub Docs — Reusing workflows (permissions can only be kept or reduced through `workflow_call`):
  https://docs.github.com/en/actions/using-workflows/reusing-workflows
- GitHub Docs — Dependency caching (cache scope: a branch reads its own and the default branch's
  caches, which is why nightly on `main` warms the PR browser cache):
  https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
- GitHub Changelog 2026-07-30 — self-repository `$/` references:
  https://github.blog/changelog/2026-07-30-reference-same-repository-actions-with-self-repository-syntax/
- GitHub Changelog 2025-08-15 — SHA-pinning policy for actions:
  https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/
- actionlint checks: https://github.com/rhysd/actionlint/blob/main/docs/checks.md ·
  raven-actions/actionlint: https://github.com/raven-actions/actionlint
- zizmor audits and configuration: https://docs.zizmor.sh/audits/ ·
  https://docs.zizmor.sh/configuration/ · zizmor-action: https://github.com/zizmorcore/zizmor-action
- OpenSSF Scorecard checks (Token-Permissions, Pinned-Dependencies, Dangerous-Workflow, SAST):
  https://github.com/ossf/scorecard/blob/main/docs/checks.md
- WordPress security team, "Hardening GitHub Actions workflows" (2026-07, actionlint + zizmor in CI):
  https://make.wordpress.org/security/2026/07/13/hardening-github-actions-workflows-across-the-wordpress-organisation/
- Playwright — Continuous Integration (cache browsers by version, `install-deps` for system
  libraries, `workers`/`retries` on CI): https://playwright.dev/docs/ci
- Lighthouse CI configuration (`collect`, `--no-lighthouserc`, `startServerCommand`):
  https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
- Next.js — CI build caching of `.next/cache`:
  https://nextjs.org/docs/app/guides/ci-build-caching
- Owner's portfolio CI (`career/software-projects/portfolio/.github/workflows/ci.yml`): the
  `rockylinux:8` GLIBC 2.28 lane with the WASM SWC assertion, the whole-tree `git diff --exit-code`
  step, `persist-credentials: false`, and a single aggregate required check.

Evaluated and rejected:

- **`$/` self-repository references** (GitHub, July 2026): actionlint 1.7.12 rejects the syntax, so
  `./` stays and the zizmor `self-repository` audit is disabled in `.github/zizmor.yml` until
  actionlint catches up. Flip both together.
- **`step-security/harden-runner`**: an egress allow-list would have to track npm, the Playwright
  CDN, Hostinger and Cloudflare; the runners hold no secrets beyond `GITHUB_TOKEN`; adds ≈ 5 s per
  job and a third-party agent. Not worth it for a static site.
- **zizmor SARIF upload / code scanning**: needs `security-events: write` and clutters the Security
  tab for a solo repository; console output plus annotations fails the same PR.
- **CodeQL**: enable *default setup* in repository settings (owner toggle, no workflow to
  maintain); OpenSSF Scorecard likewise only if a badge is wanted.
- **Merge queue**: one maintainer; the ruleset already requires branches to be up to date.
- **`paths-ignore` on `ci.yml`**: would leave the required `ci` check pending on docs-only pull
  requests. The whole push-to-main run costs ≈ 1.5 billed minutes, cheaper than the special-casing.
- **Skipping `playwright install-deps`** on the hosted image: saves ≈ 15 s but Playwright does not
  guarantee the image's libraries match the pinned browser build; kept.
- **`workflow_dispatch` input `sha` with an expression default**: input defaults must be literals;
  the empty default falls back to `github.sha` in `env`.
