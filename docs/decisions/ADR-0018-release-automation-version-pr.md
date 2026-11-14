# ADR-0018: Release automation by version-bump PR and a tagging workflow

Date: 2026-11-14 · Status: accepted (M1-6 redo) · Supersedes: the disabled release-please setup of
PR #167

## Context

M1-6 first merged a release-please workflow (manifest mode on `develop`). It could not run: PRs
opened with `GITHUB_TOKEN` do not trigger CI, and `main`/`develop` require a green `ci-gate`, so it
needed a GitHub App or fine-grained PAT that only the owner can grant (ecosystem 15.4). Owner
decision OD-78 (2026-11-14, `docs/master-plan/owner-decisions.md`) makes every repository use the
engineering-standards pattern instead: a version-bump PR on the integration branch plus a
`release.yml` that tags `vX.Y.Z`, with immutable releases and the `v*` tag ruleset, and no App or PAT.
Reference: engineering-standards ADR 0003 (release automation without release-please).

## Decision

1. `package.json` `version` is the single version source (no `VERSION` file).
2. A release starts as a normal PR into `develop` that bumps `version` and moves the
   `## [Unreleased]` entries of `CHANGELOG.md` under `## [X.Y.Z] - YYYY-MM-DD` (Keep a Changelog;
   the heading accepts a hyphen or an em dash). It runs the full CI.
3. Promotion stays the existing release PR `develop` → `main` (merge commit).
4. `.github/workflows/release.yml` runs on push to `main` only. `tools/release-notes.ts` reads the
   version and the CHANGELOG section; the workflow creates the tag and a GitHub Release on the merge
   commit, skips when the release exists, and fails when the version has no section and no release.
   Immutable releases and the `v*` tag ruleset (already enabled) make a published release final.
5. `release.yml` neither builds nor deploys (Hostinger builds every merge to `main`) and is
   independent of the manual `deploy.yml`.
6. release-please remains optional later if the owner provides a GitHub App; it would replace step 2
   only. Its workflow, config and manifest are removed.

## Consequences

- Good: no credentials beyond `GITHUB_TOKEN` with `contents: write` on `main`; every released commit
  passed `ci-gate`; the release notes are the reviewed CHANGELOG text.
- Bad: the CHANGELOG is curated by hand (PR template and CONTRIBUTING require an Unreleased entry);
  a promotion without a version bump creates no new release (the workflow skips because the
  release exists); a bumped version without a section fails the workflow. A tag that already exists
  without a published release (`v1.0.0` has only a draft) is never re-targeted: the workflow skips
  with a notice, so the first release after this ADR must bump the version.
- The SBOM attachment named in `docs/master-plan/ci-cd.md` section 6 is a follow-up.

## Confirmation

`tests/unit/release.test.ts` requires a CHANGELOG section for the current `package.json` version,
covers the extraction (hyphen and em dash headings, missing and empty sections) and asserts that
`release.yml` triggers only on push to `main`.
