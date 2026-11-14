---
name: resume-refactor
description: "Use when continuing the master refactor in a fresh session: find the true next roadmap item from RESUME.md, the progress log and git history, then continue it. Not for starting unrelated work, skipping the owner decisions, or marking items done without evidence."
allowed-tools: Read, Grep, Glob, Bash
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Resume the refactor

Plan: `docs/master-plan/README.md`. Entry point: `docs/master-plan/RESUME.md`. Binding decisions:
`docs/master-plan/owner-decisions.md`. Status: `docs/master-plan/progress.md` and
`docs/master-plan/roadmap.md`.

## Checklist

- [ ] Read `RESUME.md`, then `progress.md` (current milestone, in-flight tasks), then the roadmap row.
- [ ] Reconcile the docs with reality: `git log --oneline --grep "M2-"` (use the current milestone) and
  open PRs for it. A `todo` row with an open PR is in progress: continue that PR.
- [ ] Pick the first unchecked row of the current milestone whose dependencies are done.
- [ ] Read the owner decisions that cover it before acting.
- [ ] Start from fresh `origin/develop` on a `type/kebab-case` branch in its own worktree.
- [ ] Do the one task; keep the PR within one concern; run `npm run check` or the task's gates.
- [ ] Record the result in `progress.md` only when the lead or owner flow says so; never mark a row
  done without command output as evidence.

## Verify, fix, re-verify

If docs and git history disagree, trust git history and report the mismatch. After the task, re-run
its acceptance command from the roadmap row and quote the result.

## Output template

```
Milestone: <M#>   Next item: <id and title>   Evidence it was not done: <log or PR>
Decisions consulted: <ids>   Plan: <steps>   Blockers: <list or none>
```

## Limits

- Not for starting work outside the roadmap, changing owner decisions, or merging and deploying.
- Production (`pequeverso.com`) does not change before the milestone that says so; no hotfixes from this skill.
