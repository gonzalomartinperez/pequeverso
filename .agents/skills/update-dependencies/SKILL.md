---
name: update-dependencies
description: "Use when handling the weekly Dependabot pull request or a dependency bump: read the changelogs, fix breakage on the same branch and keep CI green. Not for merging the update, loosening checks to pass, or adding new dependencies."
allowed-tools: Read, Grep, Glob, Edit, Bash
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Update dependencies

Policy: `docs/dependency-updates.md`; configuration: `.github/dependabot.yml`. One weekly PR into
`develop` on Monday; the owner merges it. Dependency updates are their own PR (one owner per lockfile change).

## Checklist

- [ ] Check out the update branch in a worktree; `npm ci`.
- [ ] Read the changelog or release notes first for the high-risk packages: `next`, `react`,
  `react-dom`, `typescript`, `tailwindcss`, `zod`, `@playwright/test`, Base UI. Note breaking
  changes and deprecations (the Next.js docs in `node_modules/next/dist/docs/` match the installed version).
- [ ] Majors and security fixes get their own look; verify version pins stay exact where the repo pins them.
- [ ] Gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run knip:production`, `npm run knip`,
  `npm run build`, `npm run check:bundle`.
- [ ] Browser: `npm run test:browser` (isolated Playwright Chromium; keep browser revisions aligned with
  the Playwright package).
- [ ] Audit: `npm audit --omit=dev --audit-level=high` shows nothing new.
- [ ] Fix breakage with the smallest change on the same branch; re-run the failing gate.

## Verify, fix, re-verify

Every fix is followed by the gate that failed, then the full list. If a package cannot be updated without
a design decision, pin it back, say why, and report; do not silence a check.

## Output template

```
Updated: <package old -> new, risk>   Breaking changes read: <links or file paths>
Fixes made: <file | reason>   Gates: <command | pass or fail>
Held back: <package and reason>   Not verified: <list>
```

## Limits

- Not for merging or approving the PR, adding dependencies, editing workflows, or lowering budgets.
- Never edit lockfiles by hand; use npm. Never touch `.env*` secrets.
