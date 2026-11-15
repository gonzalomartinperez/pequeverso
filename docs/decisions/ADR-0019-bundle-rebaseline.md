# ADR-0019: Re-baseline the bundle ceilings to the nightly environment

Date: 2026-11-15 · Status: accepted · Owner approval: owner 2026-11-15 ("tenés mi ok para todo")

## Context

The Nightly `scorecard` job (`.github/workflows/nightly.yml`) fails with 16 bundle regressions
against `ratchets/bundle.json`, for example `/ css` 34.85 KB gzip against a ceiling of 34.4 and
`/ html` 49.14 against 49.1 (nightly run 43748993565). The ceilings were taken from
`npm run check:bundle` on the export build at `f4ce311` (branch `perf/m3-3-js-budget`, M3-3).

Evidence that nothing grew:

- Building the baseline commit `c551f6c` (which tightened the ratchets) the nightly way already
  measures css 34.8 and html 49.2, above its own ceilings.
- The CSS on `develop` is byte-identical to the CSS of `c551f6c`.

So the ceilings were never reachable in the nightly environment. Both use the export build
(`NEXT_OUTPUT=export`, `check-bundle-budget.ts` over `out/`). M4-2 (PRs #224 to #226) moved CI to an
assembled standalone site (`SITE_DIR`), but the nightly scorecard still measures the export, so the
build mode and the artifact are not the difference. The difference is the environment: the nightly
builds on a clean runner with its own `env:` block (production site URL, a test checkout URL,
assistant, site analytics and design gallery off), whereas the ceilings were read on a developer
branch build. Re-measuring at `develop` `df03e13` with the nightly `env:` block confirms it: every
html and css key (16 of 24) is above its ceiling by 0.1 to 1.4 KB, and every js key is below it. The
ceilings were measured in a different environment than the one that enforces them.

The scorecard rule (`docs/master-plan/scorecard.md`) is that ratchets may only tighten and that
loosening needs an ADR and owner approval. `tests/unit/ratchets.test.ts` enforces it against
`origin/develop`, with no way to record an approved loosening.

## Decision

1. Re-baseline the bundle ceilings to values measured in the nightly environment (same build
   environment, `npm run build`, then `node tools/check-bundle-budget.ts --json`) at the `develop`
   tip `df03e13`. Only keys that regressed rise, to the measured value rounded up to 0.1 KB (the
   scorecard compares raw values, so rounding down would still fail); keys already under their ceiling keep their value. Owner approval: owner 2026-11-15.
2. A ratchet file may carry an optional `rebaseline` record
   `{ "adr": "ADR-NNNN", "approved": "<who and when>", "from": "<develop sha>" }`. `loosened` accepts
   a raised ceiling or lowered floor only when all of these hold:
   - the record differs in `adr` from the one on `develop` (each ADR excuses one loosening);
   - the ADR file exists in `docs/decisions/`, is new relative to `develop` by number (it is added in the
     same pull request; renaming an old ADR does not count) and its header reads
     `Owner approval: <approved>`, with `approved` of the form `owner YYYY-MM-DD`;
   - the key keeps its direction and unit and is not removed; `mode`, `expires` and `calibrated`
     loosening are never excused.
3. After merge the record stays in the file as the audit trail. A later pull request that loosens
   again without a new ADR fails, because the `adr` equals the one on `develop` and the old ADR is no
   longer new.
4. The measurement mismatch is prevented by measuring ceilings only from the nightly job's
   environment (the `source` of the ratchet names the commands and the commit).

## Consequences

- Good: the nightly scorecard goes green on bundle without disabling the "only tighten" test.
- Good: every loosening is an ADR, owner-approved and visible in the file history.
- Bad: the html and css ceilings are 0.1 to 1.4 KB looser than M3-3 set them (the largest step is
  `/arrepentimiento/ html`, 27.8 to 29.2); the JS ceilings (the M3-3 targets) are untouched.
- Bad: a record accumulates in the file; the next re-baseline replaces it with its own ADR.

## Confirmation

`tests/unit/ratchets.test.ts` covers the record validation, the one-ADR-one-loosening rule, the
non-excused cases (direction, unit, removal, phase) and the real comparison against `origin/develop`
(`adrApproves`). The nightly scorecard reports no bundle regression at the `from` commit.
