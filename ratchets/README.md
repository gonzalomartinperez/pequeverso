# Ratchets

One JSON file per metric (roadmap M1-9; `docs/master-plan/scorecard.md`). Every value has a `key`,
a number, a `unit` and a `direction`: `min` is a floor that may only rise, `max` is a ceiling that
may only fall. `measuredAt`, `commit` and `source` say where the baseline comes from.

- `tools/scorecard/ratchets.ts` loads and validates the files (`node tools/scorecard/ratchets.ts`).
- `tests/unit/ratchets.test.ts` fails when a file is invalid or when a baseline is loosened against
  the merge base with `origin/develop`. Tightening is a normal change; loosening needs an ADR.
- Baselines today: `coverage`, `bundle`, `lighthouse` (live, mobile), `a11y`, `repo-size` and
  `complexity` (first run). The plan adds more files as their gates land (`ci-duration`, `mutation`,
  `design-lint`, `scorecard-axes`, ...); the nightly scorecard (M2-9) compares measurements with
  these baselines.
