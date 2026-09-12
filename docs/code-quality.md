# Code quality

| Gate | Tool | Where | Fails the PR? |
|---|---|---|---|
| Format + lint | Biome 2.5 (`biome ci --error-on-warnings`), `next`/`react` domains | quality job | yes |
| Types | TypeScript 5.9 strict + `noUncheckedIndexedAccess`; `next typegen` before `tsc` | quality job | yes |
| Unit | `node --test` (`tests/unit`): edge rules ↔ golden `.htaccess`, checkout params, commerce facts | quality job | yes |
| Build | `next build` static export; generated golden file must be committed | quality job | yes |
| Media | `scripts/check-media-budget.mjs`: manifest record per file, ≤ 5 MB/file, ≤ 25 MB total, no originals | quality job | yes |
| Placeholders | `scripts/check-placeholders.mjs` | quality job (report) / deploy (strict) | deploy only |
| Dependencies | `npm audit --omit=dev --audit-level=high`; Dependabot weekly grouped | quality job | yes |
| E2E | Playwright: smoke, a11y (axe WCAG 2.2 AA), keyboard, offer modes, widget lifecycle, CTA params, failures | e2e job (3 widths + reduced motion) | yes |
| Performance | Lighthouse CI on `out/` (mobile emulation): accessibility ≥ 0.95 and CLS ≤ 0.1 are errors; performance/LCP/TBT/byte budgets warn | lighthouse job | a11y/CLS only |
| Full matrix | Nightly: 7 widths × Chromium + WebKit, visual snapshots, knip | nightly | no (report) |

Lab numbers (Lighthouse) are not field numbers: real-user Core Web Vitals are read from Search
Console / CrUX after launch (see `docs/migration.md`, monitoring).

Commits follow Conventional Commits with a body stating what was verified and what was not.
The `ci` job is the single required status check of the `main` ruleset.
