# CI/CD

Applies ecosystem sections 5-7 and 6.0 to this repo. Starting point (read from `.github/workflows`, 7 files): a fail-closed `ci` aggregate over workflow validation (actionlint, zizmor), secret scan (gitleaks, full history), quality, build (static export, OFF-only artifact transfer with checksums), hosting contract (Rocky 8, GLIBC 2.28, standalone start), eight browser legs (functional shards 1-4 and native assistant shards 1-4 against a pinned API checkout), and a Lighthouse job; plus `nightly`, `post-deploy-verify`, `production-daily`, `deploy` and `branch-policy`. Every `uses:` is already SHA-pinned. This is strong and is kept; what changes is dynamics, naming, supply-chain additions and measuring the right thing.

## 1. Measured baseline and budgets

| Item | Measured (2026-11-09) | Budget (ecosystem 6.2 public site) |
|---|---|---|
| `npm ci` cold / warm store | 235 s / 34 s | warm cache is the norm in CI (key on lockfile) |
| Lint / types / unit | 1 s / 8 s / 10 s | lint + types at most 2 min |
| Build (export) | 61 s | warm at most 4 min |
| PR critical path | not measured (the existing ci runs browser legs of up to 35 min timeout) | p50 at most 5 min, p95 at most 10 min for the `code` profile; docs profile at most 2 min |
| Nightly / release | not measured | at most 45 min / 30 min |

First task of M1: record 30 days of `gh run list --json` durations into `ratchets/ci-duration.json`; a weekly workflow prints p50 and p95 and alerts when p95 drifts above 25% of the 4-week baseline. If the PR path exceeds budget: fix cache hit rate, then split jobs, then shard (the browser matrix is already sharded 4 x 2), then paid runners (not wanted).

## 2. Profiles (`ci-profile.json` draft)

A first `classify` job (at most 30 s) reads changed files, branch name and labels, emits the profile and booleans; every downstream job has a job-level `if`. The required check is one job named **`ci-gate`** (`if: always()`, needs all jobs, passes only on `success` or `skipped`). The ruleset currently requires `ci` and `Branch policy`: M1 adds `ci-gate` while keeping a thin `ci` alias that needs `ci-gate`, the rulesets script switches the required name, and the alias is deleted one week later.

```json
{
  "$schema": "https://example.invalid/ci-profile.schema.json",
  "version": 1,
  "profiles": {
    "docs": {
      "match": ["**/*.md", "docs/**", "LICENSE*", "docs/verification/**"],
      "unless": ["docs/generated/**"],
      "run": ["markdownlint", "lychee", "readme-headings", "skills-check", "secret-scan", "workflow-lint-if-github-changed"],
      "skip": ["build", "unit", "browser", "lighthouse"]
    },
    "code": {
      "match": ["src/**", "config/**", "content/**", "contracts/**", "design/**", "public/**", "media/**", "tools/**", "tests/**", "package.json", "package-lock.json", "tsconfig*.json", "biome.json", "knip.json", "next.config.mjs", "postcss.config.json", "components.json", "lighthouserc.json", "playwright*.config.ts"],
      "run": ["lint", "types", "unit", "architecture", "knip", "build-standalone", "budgets", "lighthouse-prodconfig-affected", "browser-pr", "axe", "visual-affected", "mutation-incremental", "sbom", "dependency-review", "codeql"],
      "paths": {
        "content/**": ["unit", "browser-pr", "content-invariants", "visual-affected"],
        "src/features/assistant/**": ["assistant-native-suite"],
        "contracts/assistant-api/**": ["contract"],
        "src/shared/motion/**": ["frame-time", "visual-affected"],
        "design/**": ["tokens-build", "contrast", "visual-all"]
      }
    },
    "contract": {
      "match": ["contracts/**", "tests/assistant/api-revision"],
      "run": ["code", "contract-schema", "consumer-compile", "native-assistant"],
      "label_required_for_breaking": "contract-major"
    },
    "workflow": {
      "match": [".github/**"],
      "run": ["actionlint", "zizmor-high", "sha-pin-policy", "reusable-workflow-dry-run"]
    },
    "deps-weekly": {
      "branch": "dependabot/**",
      "run": ["code", "dependency-review", "license-check", "lockfile-lint", "sbom-diff", "hosting-contract"]
    },
    "release": {
      "base": "main", "head": "develop",
      "run": ["code", "browser-matrix-full", "visual-all", "mutation-full-or-last-nightly", "lighthouse-5x", "sbom", "changelog-check", "hosting-contract"]
    },
    "hotfix": {
      "head": "hotfix/**", "base": "main", "requires_label": "owner-authorized",
      "run": ["code", "post-deploy-verify-plan", "back-merge-pr"]
    }
  },
  "fail_closed": "any changed file matched by no profile runs the code profile"
}
```

A unit test (`tests/unit/ci-profile.test.ts`) loads this file, lists `git ls-files`, and fails if any file falls outside every profile.

## 3. Graph

```
classify ─┬─> static (lint, types, architecture, knip, design lint)
          ├─> unit shards + property + diff-coverage ──────────────┐
          ├─> security (zizmor, gitleaks, osv, codeql, dep-review) ─┤
          └─> build ONCE (standalone, webpack; export parity nightly) ─> bundle/media/scene budgets
                    ├─> browser (Chromium + iPhone WebKit tagged) + axe + frame-time
                    ├─> lighthouse (prod-config build, 5 runs) 
                    ├─> hosting contract (Rocky 8, GLIBC 2.28, standalone smoke)
                    └─> assistant native suite (only when the assistant or its contract changed)
                                                               └─> ci-gate
```

Rules (ecosystem 6.1): concurrency per ref with cancel in progress for PRs only; caches keyed on lockfile (npm store, `.next/cache` keyed on lockfile and source hash, Playwright browsers per version); `timeout-minutes` on every job; Playwright blob reports merged in a final job; shards sized from measured durations (today 4 + 4, reduce when the production-config Lighthouse lane lands and the matrix is reviewed). Build once: the standalone build artifact is the one tested and measured; the export artifact exists only in the nightly parity job until M4. The existing OFF-only artifact transfer (manifest with SHA-256 per file, producer SHA binding) is kept and applied to the standalone tree.

Important change (finding F-04): the Lighthouse lane builds with a fake pixel id and loads real third-party hosts, so the cost seen by users is the cost CI sees; the assertion levels move from `warn` to `error` for the gates in `testing.md` section 1; a nightly lane runs Lighthouse against the live URL (and `post-deploy-verify` keeps its informative run, now compared with the ratchet).

## 4. Dependabot: weekly single PR (ecosystem section 5)

Replace the current four-PR configuration (frameworks and npm-minor-patch groups plus tools/media plus actions; open limit 4; three PRs open now: #148, #149, #150) with the standard:

```yaml
version: 2
multi-ecosystem-groups:
  weekly:
    schedule: { interval: weekly, day: monday, time: "09:00", timezone: America/Argentina/Buenos_Aires }
    target-branch: develop
updates:
  - { package-ecosystem: npm, directory: /, multi-ecosystem-group: weekly, patterns: ["*"], open-pull-requests-limit: 1, cooldown: { default-days: 7, semver-major-days: 21, semver-patch-days: 3 } }
  - { package-ecosystem: npm, directory: /tools/media, multi-ecosystem-group: weekly, patterns: ["*"], open-pull-requests-limit: 1, cooldown: { default-days: 7 } }
  - { package-ecosystem: github-actions, directories: ["/", "/.github/actions/*"], multi-ecosystem-group: weekly, patterns: ["*"], open-pull-requests-limit: 1, cooldown: { default-days: 7 } }
```

Hostinger sites keep the long cooldowns (a bad dependency ships straight to production); the existing `ignore` entries (majors of `next`, `react`, `react-dom`, `typescript`, `@types/node`, and the single bad Playwright 1.64.0 release) stay. `dependency-policy.yml` (read-only metadata assessment that labels framework updates for manual review) keeps working with one group: its `REVIEW_REQUIRED` list becomes a changelog-reading checklist in the `update-dependencies` skill. `tests/unit/dependabot-manual.test.ts` is updated to assert the single group. Shared `deps-weekly-guard` runs Monday 10:30 ART (closes the older of two PRs, keeps the survivor current, labels `needs-fix` when red). Rollout waits for the sandbox proof (E2): the four unverified points of ecosystem 5.4. Until proven, the three open PRs are merged or closed by the owner as they are.

## 5. Security hardening (ecosystem 6.4, 7)

| Control | State | Plan |
|---|---|---|
| `permissions: {}` at workflow top, grants per job | already | keep (zizmor enforced) |
| SHA-pinned actions, persist-credentials false | already | add repo policy "require full-SHA pinning" |
| zizmor, actionlint, gitleaks | already | keep; zizmor min severity stays low for this repo |
| `pull_request_target` | only `branch-policy.yml`, no checkout, `permissions: {}` | keep (documented safe pattern) |
| CodeQL | owner toggle, not a workflow | enable default setup (public repo) in M1; add `actions` language |
| Scorecard | none | weekly action, SARIF, fail if score drops more than 1 point; accept ceiling on Code-Review and Branch-Protection for a solo repo |
| Dependency review | none | `dependency-review-action` on PRs |
| osv-scanner | none | daily scheduled job opens one `vuln` issue, no PR (owner rule); weekly check of `production` digests is not applicable (no image) |
| Secret scanning and push protection | gitleaks only | turn on GitHub secret scanning and push protection (settings via the rulesets script) |
| `npm ci --ignore-scripts` | `.npmrc` present | verify the allow-list for build scripts; no change expected |
| SBOM | none | CycloneDX JSON of the production dependency tree as a CI artifact and release asset (`@cyclonedx/cyclonedx-npm` or Syft on the standalone tree); no image attestation because no image exists |
| Provenance | n/a for Hostinger's build | compensating controls (ecosystem 7, Hostinger sites): `main` ruleset, `v*` tag ruleset, post-deploy `build-info.json` check against the merge SHA, long cooldown, post-build scan of `.next` output for forbidden strings |
| Third-party actions that see secrets | none needed | keep it that way (no deploy secrets exist: Hostinger pulls from GitHub) |
| harden-runner | none | audit mode on the `release` and `deploy` jobs only (public repo, free tier) |
| Environments | `production` with required reviewer for `deploy.yml` | keep; the `deploy` workflow's static publishing path is retired at M4 (PV-D3); its tag-and-verify steps survive as `release-verify` |

## 6. Release (ecosystem section 3)

- Flow: task branch to `develop` (merge commit, `ci-gate`, strict; PR title is a Conventional Commit), release PR `develop` to `main` (merge commit) on demand; hotfix directly to `main` only with explicit owner OK (none planned before M7, DR-01), then an automatic back-merge PR; never `--admin`.
- Version-bump PR on `develop` (OD-78, ADR-0018; engineering-standards ADR 0003): a normal PR sets `package.json` `version` and moves `[Unreleased]` under `## [X.Y.Z] - date` in `CHANGELOG.md`; `release.yml` on `main` creates `vX.Y.Z` on the merge commit and an immutable GitHub Release from that section (SBOM attachment stays a follow-up). No GitHub App or PAT. release-please (E5) is optional later if the owner provides an App.
- Because Hostinger builds every merge to `main`, a release is also a deployment: `post-deploy-verify` (existing, enabled by `HOSTINGER_MAIN_AUTODEPLOY_ENABLED=true`) waits until `build-info.json` shows the merged SHA, then runs smoke, headers, prod Playwright and the live Lighthouse lane; a merged PR and green CI never prove deployment.
- Rollback: a revert PR on `main` (Hostinger has no rollback UI); rehearsed once before M7.
- The launch gates in `deploy.yml` (`check:placeholders:strict`, `check:media --strict`) are not applied when `main` autodeploys. They move into the `release` profile as required checks on the `develop` to `main` PR.

## 7. Nightly and weekly

Nightly (`nightly.yml`, 04:17 UTC): Chromium, Firefox, WebKit, iPhone and Pixel across widths, visual baselines in the pinned image, clean-clone invariant, full mutation (scoped), flake detector (`--repeat-each`), Lighthouse 5 runs per route on the production-config build and on the live URL, ZAP baseline, export parity build (until M4), osv-scanner, Scorecard, `scorecard.json` plus ratchet check. Weekly: dependency PR and guard, mutation full, CI duration report, link check of docs, standards drift (`standards.lock`), Search Console reminder for the owner (monthly). Failures open one issue per class and are fixed forward or reverted (ecosystem 15A).
