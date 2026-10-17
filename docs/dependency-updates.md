# Dependency updates: manual profile

## Current policy — 2026-10-17

Every Dependabot update requires manual review and a protected merge. Weekly version-update
schedules for every configured ecosystem, groups, cooldowns and native `rebase-strategy: auto` remain enabled. This profile
does not pause future updates or hide alerts. The historically named
`dependabot-automerge.yml` now reports metadata with read-only permissions; it cannot approve,
arm auto-merge or merge a PR. Its candidate classification is advisory, never authorization.

The previous `gh pr merge --auto` command could immediately merge a clean, green PR instead
of only arming a future native merge. The writer was removed. A future automation proposal
needs independent review, strict current-head checks/protection/review validation and a real
`GITHUB_TOKEN` proof. No such proof is claimed here.

## Review checklist

1. Verify authenticated app identity, base/head repositories and exact current head; inspect
   every commit, changed file, manifest and lock dependency, including transitive/grouped changes.
   Names, branch prefixes, labels and a green metadata summary do not establish safety.
2. Read release notes and changelogs. Frameworks, auth, databases, compilers, test runners,
   majors, prereleases, sensitive 0.x changes, Actions and container bases require explicit
   review. Unknown impact stays manual; no universal low-risk allowlist is inferred.
3. Wait for the required current-head CI and independent review. Keep protections intact;
   no bot approval, PAT, `--admin`, direct push or bypass. Squash ordinary PRs into `develop`.
4. Release `develop` → `main` by protected merge commit when authorized. Hostinger builds
   `main`, so a storefront release can publish production. The assistant must remain disabled.

Security alerts stay visible. Routine `target-branch: develop` does not redirect all security
updates from default `main`; assess those explicitly and retarget or follow a specifically
authorized hotfix. Never automatically merge into `main` or suppress an alert for a green gate.

Use native `@dependabot rebase` when needed; do not add rebase polling or rewrite bot branches.
Close an infeasible update only with a superseded/blocked explanation. To undo a bad update,
open a normal reviewed revert/pin PR into `develop`. Disabling the merge writer does not
require setting the update PR limit to zero, disabling Dependabot, or changing repository visibility.

## Trust and verification

The assessment uses pinned metadata tooling and authenticated API reads, without checking out,
installing or executing PR code. The job token has only contents/pull-requests read permissions.
Unit regressions reject a write token or merge command in this workflow. Normal PR CI remains
separate and no existing build, visual, accessibility or architecture gate was weakened.

At reconciliation there were no open Dependabot PRs. Existing `extract-zip` accepted-risk
records remain visible; other advisories are not implicitly accepted or dismissed.
