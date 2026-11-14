---
name: score-repo
description: "Use when preparing a milestone safe point or a release, or when asked for the score or quality status of the repo, even if CI is green: compare measurements with the committed ratchet baselines and assemble the evidence pack. Not for fixing the findings or loosening a baseline."
allowed-tools: Read, Grep, Glob, Bash
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Score the repository

Scorecard targets and the three-lens rubric live in `docs/master-plan/scorecard.md`; baselines are
the JSON files in `ratchets/` (see `ratchets/README.md`); the tooling lives in `tools/scorecard/`.

## Checklist

- [ ] Branch is up to date with `develop`; note the commit SHA being scored.
- [ ] Ratchet files validate: `node tools/scorecard/ratchets.ts`.
- [ ] Run the scorecard entry point that `tools/scorecard/` provides (read its header comment for the
  command; do not guess flags). If none exists yet, say so and score from the gates below.
- [ ] Gates run for real, not from memory: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run knip:production`, `npm run check:bundle`, `npm run check:media`.
- [ ] Each measurement is compared with its baseline: "min" may not fall, "max" may not rise.
- [ ] Three lenses written down: correctness and safety, user outcomes (a11y, performance, conversion
  safety), maintainability. Each claim cites a command output or a file.

## Verify, fix, re-verify

If a metric regressed, report it with the baseline, the new value and the commit that moved it. Do not
edit `ratchets/*.json` to make a regression pass; tightening is allowed, loosening needs an ADR.
After a fix lands (a separate task), re-run only the failing metric and the validator.

## Output template

```
Scored commit: <sha>   Date: <YYYY-MM-DD>
| Metric | Baseline | Measured | Direction | Status |
Lens 1 correctness and safety: <evidence>
Lens 2 user outcomes: <evidence>
Lens 3 maintainability: <evidence>
Regressions: <none | list>   Not measured: <list and why>
```

## Limits

- Not for fixing findings, merging, or loosening a baseline; a failed or missing measurement is reported
  as "not measured", never as a pass.
- No network calls to production services; live Lighthouse numbers come from the existing ratchet or the nightly run.
