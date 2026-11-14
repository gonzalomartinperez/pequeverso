# Development

## Requirements

- Node 24.22.0 LTS (`.nvmrc`; `engines` allows 22.18+, the first release that runs `.ts` files without a flag). `nvm use` on macOS/Linux, `nvm use $(cat .nvmrc)` on Windows nvm.
- npm bundled with Node. `.npmrc` enforces exact versions, engine checks and **no lifecycle scripts**.
- No system ffmpeg/ImageMagick needed: media outputs are committed; the pipeline in `tools/media` is
  optional and has its own `package.json` (it allows install scripts for `ffmpeg-static`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | `build-info.json` → `next build` (static export to `out/`, the parity target) → `out/.htaccess`; `npm run build:standalone` builds the production target (ADR-0010) |
| `npm start` | Serves `out/` with production-like semantics (`tools/serve-static.ts`), or the standalone server when `.next/standalone` exists; both serve `/api/meta/events/` (`META_CAPI_ACCESS_TOKEN=… npm start` to enable the relay locally) |
| `npm run lint` / `lint:fix` / `format` | Biome |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (TypeScript 7) + `tsc -p tsconfig.node.json` (Node-run files under `nodenext`) |
| `npm run typecheck:media` | `tools/media` project (after `npm ci --prefix tools/media --ignore-scripts`) |
| `npm test` | Unit tests (`node --test`, TypeScript via Node type stripping) |
| `npm run test:property:nightly` | fast-check suites in `tests/unit/property/` at 1000 runs (PR runs 100 inside `npm test`); a failure prints its seed: reproduce with `FC_SEED=<seed> FC_NUM_RUNS=<n>` |
| `npm run test:browser` | Playwright against `out/` (build first) |
| `npm run check` | Lint, types, unit tests, production knip, export and media/render/bundle gates; CI also runs skills, media types, production audit, workflow/security scans, parity, browser and fixture-assistant jobs |
| `npm run check:media` | Media budget and manifest provenance |
| `npm run check:placeholders[:strict]` | Report / fail on `[[PLACEHOLDER]]` tokens |
| `npm run check:skills` | Skill catalog: frontmatter and `metadata`, body at most 120 lines, `evals/triggers.json` and `evals/evals.json` structure, symlinks, review age (warns after 180 days) |
| `npm run lhci` | Lighthouse CI on `out/` (3 runs, mobile) then the strict ratchet assertion `node tools/lhci-assert.ts ratchets/lighthouse-lab.json`; `npm run lhci:production-config` builds the fake-pixel `out-lhci/` first (see Lighthouse lanes) |
| `npm run scorecard -- --inputs <dir> --out scorecard.json` | Compares measurements (`<dir>/coverage/lcov.info`, `<dir>/bundle.json` from `node tools/check-bundle-budget.ts --json`, `<dir>/.lighthouseci`, repo size from `git ls-files`) with `ratchets/*.json`; missing inputs are `missing`, a regression exits 1; `--need coverage,bundle` also fails on incomplete inputs. Runs nightly (`scorecard` job, artifact `scorecard`, 30 days) |
| `npm run build:standalone` | Node target build (fallback), for parity checks |
| `npm run build:design-gallery` / `test:browser:design-gallery` | Verification export WITH the `/_design` state gallery in `out-design-gallery/` (unpublishable), and its light Playwright spec; see `docs/design-system.md` |
| `npm run check:design-gallery-disabled` | Fails when `out/` (or the standalone `.next` output) contains the gallery route, directory, chunk or marker; `npm run build` runs it with `--allow-enabled` |

## Skill activation evals (local)

CI only validates the eval banks structurally (OD-79: no paid model calls in CI). To measure
activation of a changed skill, on your machine: run every query of `evals/triggers.json` three times
in a clean session, record whether the skill activated, count a query as triggered when at least
half of its runs did (positives should pass, near-miss negatives should not), and compute precision
and recall on the `validation` split only. A skill change should not merge if validation accuracy
drops by more than 10 points or the output delta in `evals/evals.json` (with versus without the
skill) turns negative. The scoring script comes with the engineering-standards eval tooling.

## Environment

Copy `.env.example` to `.env.local` before the first build (`cp .env.example .env.local`).
`NEXT_PUBLIC_*` values are inlined at build time; `tools/check-env.ts` refuses to build without
`NEXT_PUBLIC_SITE_URL` and a checkout URL, and the repository carries no inline defaults for them.
With the optional variables empty no pixel is injected and the Conversions API relay answers `204`.

## Lighthouse lanes (M2-1)

- **PR (`performance` job)**: `lighthouserc.json` runs Lighthouse mobile, 3 runs per URL (12 runs; sized
  for the 15 minute job, drop to 2 if it gets close), on the production-config export (fake pixel id
  `1234567890123456`, fake `TEST0000000` offer, real third-party hosts) for home, kit,
  `/imprime-y-juega/` (upsell) and the kit thanks page.
  - `tools/lhci-assert.ts` asserts at `error` level the median of the runs for performance, LCP, TBT,
    CLS and first-party script transfer KB (`js-kb`, same-origin scripts) against `ratchets/lighthouse-lab.json` (the only copy of those
    thresholds). It is strict: every key must be checked, a route with fewer runs than expected, a
    `runtimeError` run or a missing or non-finite value fails, and an unknown metric in a key throws.
    The ratchet may only tighten (`tests/unit/ratchets.test.ts`). `third-party-js-kb` (Meta, the Hotmart
    funnel; it varies between runs) is recorded and reported at WARN, never failing; revisit in M3-3.
    The step prints a route | metric | median | limit | status table. Starting values come from CI run
    43592256267.
  - lhci itself asserts accessibility at `error`; best-practices, SEO and the image (1.1 MB) and total
    (1.5 MB) byte budgets stay at `warn` (home and kit only).
- **No events reach Meta**: `connect.facebook.net` loads, so `fbevents.js` counts toward TBT and JS KB,
  but every `*.facebook.com` request is blocked (`blockedUrlPatterns`), which includes the `/tr` pixel
  ping, and the CAPI relay answers `204` in CI (no token).
- **Nightly live (`lighthouse-live` job)**: `lighthouserc.live.json` measures `https://pequeverso.com/`
  and `/grafismo-fonetico/` (5 runs, mobile, read-only), writes the manifest with `lhci upload`, and
  compares the median with `ratchets/lighthouse.json` (live values, 2 of its 5 routes, hence
  `--allow-missing-paths`) with 15% tolerance. It blocks `connect.facebook.net`, `*.facebook.com`
  and `pequeverso.com/api/*` so neither the browser nor the production CAPI relay can forward a
  PageView to Meta (consequence: Meta's script cost is not in the live numbers; the PR lane measures
  it). Run it only in CI. Reports go to the `lighthouse-live` artifact.
- **Local run** (one command; the measurement lane for M3 before/after numbers):
  `npm run lhci:production-config` builds the fake-pixel export into the gitignored, unpublishable
  `out-lhci/` (`tools/build-lhci.ts`; `out/` and `.next/` are untouched), serves it and runs
  `npm run lhci`. It needs a Chrome (`CHROME_PATH`, for example the Playwright Chromium). Use
  `npm run build:lhci` then `SERVE_DIR=out-lhci npx lhci autorun --collect.numberOfRuns=1` for a quick
  pass.
- **Tightening**: after the first CI runs on develop, download the `.lighthouseci` artifact and run
  `node tools/lhci-assert.ts ratchets/lighthouse-lab.json --suggest > /tmp/lab.json`; it prints the
  ratchet with 10% headroom (at least 0.25 s, 5 KB or 5 points), never looser than today. `--dir` accepts a
  downloaded artifact. Review and copy it over the file.

## Conventions

- Server Components by default; `"use client"` only at leaves that need the browser.
- Copy in `content/es/*.ts` (typed objects), facts in `config/*.ts`; Tailwind utilities use tokens
  from `src/app/globals.css`. CSS Modules are reserved for custom geometry; see the design system.
- TypeScript for every new file (ADR-0007). Scripts, server code, unit tests and anything they
  import run under Node's type stripping: erasable syntax only (no `enum`, runtime `namespace`
  or parameter properties), `import type` for types, relative imports with the `.ts` extension,
  no `paths` aliases for values. Run them with `node tools/x.ts`; no tsx/ts-node.
- Path aliases: `@/…` → `src`, `@config/…`, `@content/…`, `@server/…` for bundled code. Pure
  libraries that unit tests import use relative `.ts` imports so Node can run them directly.
- Optional props that receive forwarded values (`className={styles.x}`) are typed
  `prop?: T | undefined` (`exactOptionalPropertyTypes`).
- Every media file referenced from the UI must exist in `media/manifest.json` (CI fails otherwise).
- Tests: add a Playwright spec for behaviours (offer modes, CTA params, widget lifecycle, a11y) and
  a unit test for pure logic (params, edge rules, content invariants).

## Playwright locally

The locked test runner is Playwright **1.64.1** (Chromium, Firefox and WebKit);
install browsers through this checkout's CLI after `npm ci`. Device descriptors now
propagate their screen size in Playwright 1.64; the existing viewport/device and
accessibility assertions remain authoritative. A browser upgrade does not authorize
automatic screenshot replacement or changed comparison thresholds.

For concurrent worktrees on a shared workstation, use a task-owned
`PLAYWRIGHT_BROWSERS_PATH` consistently for installation and execution, or set
`PLAYWRIGHT_SKIP_BROWSER_GC=1` when installing. Never uninstall another task's
browsers. CI's browser cache is keyed by the locked Playwright version, so the
first run after this update is a cold cache. See the official
[browser management guide](https://playwright.dev/docs/browsers#stale-browser-removal).

```bash
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:browser -- --project=chromium-390 --project=chromium-1440
npm run test:browser -- tests/browser/text-zoom.spec.ts --project=chromium-390 --project=firefox-390 --project=webkit-390
```

Projects: `chromium-1440`, `chromium-768`, `chromium-390`, `reduced-motion`, plus targeted text-zoom
`firefox-390` and `webkit-390` (PR set);
`PW_SET=nightly` uses `chromium-<w>` / `webkit-<w>` at 1440/1280/1024/768/430/390/360;
`PW_SET=visual` uses `visual-chromium-390` / `visual-chromium-1440` for reference comparisons.
