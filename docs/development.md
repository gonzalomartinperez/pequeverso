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
| `npm run build` | `build-info.json` → `next build` (static export to `out/`) → `out/.htaccess` |
| `npm start` | Serves `out/` with production-like semantics (`tools/serve-static.ts`), or the standalone server when `.next/standalone` exists; both serve `/api/meta/events/` (`META_CAPI_ACCESS_TOKEN=… npm start` to enable the relay locally) |
| `npm run lint` / `lint:fix` / `format` | Biome |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (TypeScript 7) + `tsc -p tsconfig.node.json` (Node-run files under `nodenext`) |
| `npm run typecheck:media` | `tools/media` project (after `npm ci --prefix tools/media --ignore-scripts`) |
| `npm test` | Unit tests (`node --test`, TypeScript via Node type stripping) |
| `npm run test:browser` | Playwright against `out/` (build first) |
| `npm run check` | Lint, types, unit tests, production knip, export and media/render/bundle gates; CI also runs skills, media types, production audit, workflow/security scans, parity, browser and fixture-assistant jobs |
| `npm run check:media` | Media budget and manifest provenance |
| `npm run check:placeholders[:strict]` | Report / fail on `[[PLACEHOLDER]]` tokens |
| `npm run lhci` | Lighthouse CI on `out/` |
| `npm run build:standalone` | Node target build (fallback), for parity checks |

## Environment

Copy `.env.example` to `.env.local` before the first build (`cp .env.example .env.local`).
`NEXT_PUBLIC_*` values are inlined at build time; `tools/check-env.ts` refuses to build without
`NEXT_PUBLIC_SITE_URL` and a checkout URL, and the repository carries no inline defaults for them.
With the optional variables empty no pixel is injected and the Conversions API relay answers `204`.

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
