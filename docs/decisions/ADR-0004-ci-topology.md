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
