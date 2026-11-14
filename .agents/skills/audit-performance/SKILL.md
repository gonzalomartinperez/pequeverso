---
name: audit-performance
description: "Use when measuring or protecting the performance of pequeverso.com (LCP, CLS, TBT, bundle, third parties before consent) after a change or before a release. Not for fixing the regressions it finds, redesigning pages, or load-testing production."
allowed-tools: Read, Grep, Glob, Bash
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Audit performance

Targets (`AGENTS.md`): LCP at most 2.5 s, CLS at most 0.1, TBT at most 200 ms at 390 px (lab).
Method and history: `docs/performance.md`; settings: `lighthouserc.json`; baseline: `ratchets/lighthouse.json`
and `ratchets/bundle.json`.

## Checklist

- [ ] State which build target is measured (standalone is production; the static export is a parity build).
- [ ] Build with the production configuration: `npm run build` (needs `.env.local` copied from
  `.env.example`).
- [ ] Budgets: `npm run check:bundle`, `npm run check:media`, `npm run check:scene`.
- [ ] Lighthouse at 390 px: `npm run lhci`; summarise with `tools/lhci-summary.ts` when it helps.
- [ ] LCP element and layout stability: `npm run test:browser -- tests/browser/lcp.spec.ts`.
- [ ] No third-party request before consent: `npm run test:browser -- tests/browser/consent.spec.ts`.
- [ ] Frame time and long animation frames (LoAF) for motion-heavy pages, measured in the isolated
  Playwright Chromium; record the numbers, not impressions.

## Verify, fix, re-verify

For each regression record metric, baseline, measured value and the change that moved it. Fix in a
separate step, re-run only the failing check, then `npm run lint && npm run typecheck && npm test`.
Never loosen `ratchets/*.json` or `config/budgets.json` to pass.

## Output template

```
Target and commit: <standalone|export> <sha>
| Metric | Baseline | Measured | Status |
Budgets: bundle <pass|fail>, media <pass|fail>, scene <pass|fail>
Third parties before consent: <none | list>   Not measured: <list and why>
```

## Limits

- Not for load or stress testing, production-only measurement without an explicit task, or fixes
  bundled into the audit. Lab numbers are not field data: say so.
