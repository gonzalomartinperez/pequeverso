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
