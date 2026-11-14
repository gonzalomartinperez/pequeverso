# Ratchets

One JSON file per metric (roadmap M1-9; `docs/master-plan/scorecard.md`). Every value has a `key`,
a number, a `unit` and a `direction`: `min` is a floor that may only rise, `max` is a ceiling that
may only fall. `measuredAt`, `commit` and `source` say where the baseline comes from.

- `tools/scorecard/ratchets.ts` loads and validates the files (`node tools/scorecard/ratchets.ts`).
- `tests/unit/ratchets.test.ts` fails when a file is invalid or when a baseline is loosened against
  the merge base with `origin/develop`. Tightening is a normal change; loosening needs an ADR.
- Baselines today: `coverage`, `bundle`, `lighthouse` (live, mobile), `lighthouse-lab` (production-config export, CI gate `tools/lhci-assert.ts`), `a11y`, `repo-size` and
  `complexity` (first run). The plan adds more files as their gates land (`ci-duration`, `mutation`,
  `design-lint`, `scorecard-axes`, ...); the nightly scorecard (M2-9) compares measurements with
  these baselines.

## Scorecard run (M2-9)

`npm run scorecard -- --inputs <dir> --out scorecard.json [--need coverage,bundle]`
(`tools/scorecard/run.ts`) measures what the inputs contain, maps each measurement onto the ratchet
`key`, and exits 1 when a floor is undercut or a ceiling exceeded. Measurements are compared raw (not
rounded; the baselines are rounded values, so a run within rounding of a baseline can read as a
regression). Inputs: `coverage/lcov.info` (`coverage`), `bundle.json` from
`node tools/check-bundle-budget.ts --json` (`bundle`), `.lighthouseci/` (`lighthouse`, median over
all runs per URL and metric) and repo size from `git ls-files` (`repo-size`). `a11y` and `complexity`
have no collector yet. Anything not measured is `missing` (never pass); an absent or malformed input
is recorded with a reason under `inputProblems`. `--need` makes missing values of the listed
metrics fail the run. `scorecard.json` lists per metric the baseline, the measurement and the status,
and per axis (D*, P*, C*) which metrics feed it (an axis with an absent or empty input group is
`missing`); judgement axes are `evaluator` and are not computed.

The nightly `scorecard` job produces coverage, bundle and repo size itself and requires coverage and
bundle. It leaves Lighthouse `missing` on purpose: the `lighthouse` baselines are the live site,
while the nightly lab run is the local export, so they are not comparable (the M2-1 production-config
lane adds its own keys). Two regressions are expected on the first nightlies and are reported, not
hidden: `repo-size` is exceeded until M2-5 shrinks the visual baselines, and `coverage` is currently
below its floor on develop (lines about 96.05 against 96.19, branches about 87.46 against 88.11;
M2-5 owns the coverage gate). Do not loosen either baseline.
