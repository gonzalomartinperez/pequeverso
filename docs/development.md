# Development

## Requirements

- Node 24 (`.nvmrc`; `engines` allows 22.12+). `nvm use` on macOS/Linux, `nvm use $(cat .nvmrc)` on Windows nvm.
- npm bundled with Node. `.npmrc` enforces exact versions, engine checks and **no lifecycle scripts**.
- No system ffmpeg/ImageMagick needed: media outputs are committed; the pipeline in `tools/media` is
  optional and has its own `package.json` (it allows install scripts for `ffmpeg-static`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | `build-info.json` → `next build` (static export to `out/`) → `out/.htaccess` |
| `npm start` | Serves `out/` with production-like semantics (`scripts/serve-static.mjs`), or the standalone server when `.next/standalone` exists; both serve `/api/meta/events/` (`META_CAPI_ACCESS_TOKEN=… npm start` to enable the relay locally) |
| `npm run lint` / `lint:fix` / `format` | Biome |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm test` | Unit tests (`node --test`, TypeScript via Node type stripping) |
| `npm run test:e2e` | Playwright against `out/` (build first) |
| `npm run check` | Everything CI runs in the quality job |
| `npm run check:media` | Media budget and manifest provenance |
| `npm run check:placeholders[:strict]` | Report / fail on `[[PLACEHOLDER]]` tokens |
| `npm run lhci` | Lighthouse CI on `out/` |
| `npm run build:standalone` | Node target build (fallback), for parity checks |

## Environment

Copy `.env.example` to `.env.local` before the first build (`cp .env.example .env.local`).
`NEXT_PUBLIC_*` values are inlined at build time; `scripts/check-env.mjs` refuses to build without
`NEXT_PUBLIC_SITE_URL` and a checkout URL, and the repository carries no inline defaults for them.
With the optional variables empty no pixel is injected and the Conversions API relay answers `204`.

## Conventions

- Server Components by default; `"use client"` only at leaves that need the browser.
- Copy in `content/es/*.ts` (typed objects), facts in `config/*.ts`, styles in CSS Modules with
  tokens from `src/styles/tokens.css`. No CSS-in-JS, no Tailwind.
- Path aliases: `@/…` → `src`, `@config/…`, `@content/…`. Pure libraries that unit tests import
  use relative `.ts` imports so Node can run them directly.
- Every media file referenced from the UI must exist in `media/manifest.json` (CI fails otherwise).
- Tests: add a Playwright spec for behaviours (offer modes, CTA params, widget lifecycle, a11y) and
  a unit test for pure logic (params, edge rules, content invariants).

## Playwright locally

```bash
npm run build
npx playwright install chromium
npm run test:e2e -- --project=chromium-390 --project=chromium-1440
```

Projects: `chromium-1440`, `chromium-768`, `chromium-390`, `reduced-motion` (PR set);
`nightly-chromium-<w>` / `nightly-webkit-<w>` for 1440/1280/1024/768/430/390/360; `nightly-*` visual snapshots.
