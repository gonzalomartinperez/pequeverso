# ADR-0015: Mutation testing with StrykerJS on node:test (E7 spike outcome)

Date: 2026-11-14 · Status: accepted (M2-3)

## Context

`docs/master-plan/testing.md` section 3 kept unit tests on `node:test` and asked for a spike: can
StrykerJS run on `node:test` through `tap-runner` with TypeScript 7, within an incremental PR budget
of 5 minutes and a weekly full budget of 30 minutes? The fallback was to move the scoped modules'
tests to Vitest.

## Decision

1. StrykerJS 10.1.1 with `@stryker-mutator/tap-runner` (dev dependencies only; the added licences are
   MIT, Apache-2.0, ISC, BlueOak-1.0.0 and BSD-3-Clause, all on the dependency-review allow-list;
   no LGPL). `node:test` stays; no Vitest.
2. No checker plugin. The TypeScript checker needs the JS compiler API, absent from TypeScript 7
   (`ts.parseConfigFileTextToJson` is not a function); mutants that do not compile show up as runtime
   errors and are excluded from the score. Revisit when TypeScript 7.1 ships the API.
3. Sandbox mode works only if the sandbox holds no tsconfig: Stryker's preprocessor calls the same
   missing API, so `stryker.config.json` ignores `tsconfig*.json` (type stripping needs neither). It
   also ignores `.claude`, `.agents`, `.codex` (symlinked directories break the file copy). Do not use
   `inPlace`: it rewrites every source file and leaves them mutated when the run is killed.
4. Scope (`mutate` in `stryker.config.json`): pure domain modules only, never UI glue: product
   schema, checkout URL, consent, playground domain, edge rules, assistant domain and application.
   Tests are the unit suites that cover them, with fast-check at `FC_NUM_RUNS=25`, seed 20261114.
   The consent domain and SEO view modules named in the plan do not exist yet and join when they land.
5. Thresholds: high 80, low 65, break 60 for the weekly full run, which targets 75-80. Baselines are
   in `ratchets/mutation.json`: the global `score` (68.58) and a per-file floor in `files`; both may
   only rise.
6. CI. PR: job `mutation` in `ci.yml`, selected by the `mutation` profile of `.github/ci-profile.json`
   (scoped modules or the mutation tooling changed), 5 minute job timeout and 4 minute Stryker step.
   `tools/ci/mutation-scope.ts` turns the PR diff (`HEAD^1`, the merge ref) into `--mutate`: more than
   8 scoped files are left to the weekly run, a tooling-only change smoke-runs the smallest scoped file,
   and release PRs (`develop` to `main`) and non-PR events skip. Stryker runs with `break` 0 and
   `tools/ci/mutation-gate.ts` fails only when a mutated file scores below its recorded per-file
   baseline; a file with no baseline must reach 60. The job restores the incremental file saved by the
   weekly run; a cache miss is only slower. Weekly: `mutation-weekly.yml` (Monday 03:41 UTC, 30 minute
   timeout) runs the full scope, fails when the global score is below `ratchets/mutation.json`
   (nothing is updated automatically), saves the incremental file and uploads the JSON report.

## Measurements

Workstation under heavy load (load average 35-70 on a shared WSL machine, 2 Stryker workers, the
Stryker process got about 33 percent of one CPU): the full run took 47 min 18 s for 1565 mutants,
about 16 CPU-minutes (user 684 s, system 281 s). The initial dry run took 52-117 s there
(14-29 s net test time). An incremental run of two files against a full incremental file took
1 min 43 s wall. On a quiet 2-vCPU runner the full run should land well under the 30 minute budget,
but this is not measured; the first weekly run is the real check, and the timeouts fail loudly.

Score 68.58 (997 killed, 5 timed out, 362 survived, 97 without coverage; 104 runtime errors excluded):
`checkout-url.ts` 98.4, `syllable-game.ts` 80.3, `links.ts` 80.0, `visitor-context.ts` 77.4,
`conversation.ts` 76.7, `rich-text.ts` 71.0, `consent.ts` 70.1, `edge-rules.ts` 66.9,
`assistant.ts` 60.3, `ports.ts` 33.3, `config/products/schema.ts` 29.8, `models.ts` 0.0 (types and
constants only). The first jobs to raise the score are the product schema and assistant `models.ts`/`ports.ts` tests.

## Consequences

- Good: no test migration, one runner, mutation evidence in CI without new infrastructure.
- Bad: no type-aware mutant filtering until TypeScript 7.1 (noisier survivors); the per-file floors
  start low (the product schema 29.76, assistant `models.ts` 0) and rise only when someone raises
  them; mutation runs are the slowest unit-level job and use two workers.
- Risk: the 5 minute PR and 30 minute weekly budgets are unverified on CI hardware. If exceeded,
  lower `concurrency`-bound work by narrowing `mutate`, or move the scoped tests to Vitest.
