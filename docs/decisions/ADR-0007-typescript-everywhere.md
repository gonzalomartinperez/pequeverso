# ADR-0007: TypeScript everywhere, strictest flags, TypeScript 7

Date: 2026-09-24 · Status: accepted

## Context

The application (`src/`, `config/`, `content/`) was TypeScript, but the build and release tooling
was not: 17 scripts under `scripts/`, the Meta Conversions API relay core
(`server/meta-capi.mjs` plus a hand-written `.d.mts` shim that could drift from the code), the 11
unit test files and the media pipeline (`tools/media/media-build.mjs`) were JavaScript with partial
`// @ts-check`. The tsconfig was strict with `noUncheckedIndexedAccess`, but
`exactOptionalPropertyTypes` had been removed once because of React prop forwarding, the e2e
specs and `playwright.config.ts` were excluded from type checking, and nothing checked that the
files Node executes directly could actually run under Node.

TypeScript 7.0 (the native Go compiler) became `typescript@latest` on 2026-07-08. The portfolio
repository already builds with it on the same stack (Next 16.3.5, Hostinger).

## Decision

### 1. TypeScript is the default for every file we write

Application code, scripts, server code, unit and e2e tests, the media tool and the Next.js
configuration are TypeScript. Files that Node executes directly (`scripts/`, `server/`,
`tests/unit/`, `config/next.ts`, `tools/media/`) are **erasable TypeScript** run by Node's native
type stripping. There is no `tsx`, `ts-node` or build step: `node scripts/check-env.ts`,
`node --test "tests/unit/**/*.test.ts"`. They must:

- use only erasable syntax (no `enum`, runtime `namespace`, parameter properties or import
  aliases; `erasableSyntaxOnly` enforces this);
- write `import type` for type-only imports (`verbatimModuleSyntax`);
- import relative files with their `.ts` extension (`allowImportingTsExtensions`), and value
  imports only through relative paths (Node does not read tsconfig `paths`).

`engines.node` is `>=22.18 <25`: 22.18 is the first release where type stripping is on without a
flag; `.nvmrc`, CI and Hostinger use Node 24, where it has been warning-free since 24.3 and
stable since 24.12. `.npmrc` has `engine-strict=true`, so the floor was set to the lowest version
that works rather than the newest, to avoid failing an install on Hostinger's Node 24 image.

### 2. Compiler flags (`tsconfig.json`)

| Flag | State | Why |
|---|---|---|
| `strict` (+ explicit `useUnknownInCatchVariables`) | on | baseline |
| `noUncheckedIndexedAccess` | on | already on |
| `exactOptionalPropertyTypes` | **on** (re-enabled) | see "Prop forwarding" below |
| `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` | on | |
| `noUncheckedSideEffectImports` | on | CSS side-effect imports resolve through Next's ambient `*.css` module |
| `allowUnreachableCode: false`, `allowUnusedLabels: false` | on | errors instead of editor hints |
| `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` | on | Node type stripping and SWC compile file by file |
| `moduleDetection: "force"` | on | every file is a module (scripts with top-level `await` and no imports) |
| `allowJs` | off | no JavaScript in the project graph |
| `types: ["node"]` | explicit | TypeScript 6/7 default `types` to `[]` |
| `noPropertyAccessFromIndexSignature` | **off** | CSS Modules type `styles` as `{ readonly [key: string]: string }`: the flag would force `styles["foo"]` on ~100 class names in pages and features for no safety gain (`noUncheckedIndexedAccess` already types them `string \| undefined`) |
| `noUnusedLocals` / `noUnusedParameters` | **off, owned by Biome** | Biome's `noUnusedVariables`, `noUnusedImports`, `noUnusedFunctionParameters` and `noUnusedPrivateClassMembers` are errors: one tool, autofix, and no duplicate diagnostics in the editor |
| `rewriteRelativeImportExtensions` | not needed | only affects emit; every project is `noEmit` |

The e2e specs and `playwright.config.ts` are now in the root project. A second project,
`tsconfig.node.json`, re-checks the Node-executed graph (scripts, server, unit tests and the
application modules they import, `config/next.ts`) with `module`/`moduleResolution: "nodenext"`,
so a missing `.ts` extension or a CommonJS/ESM mistake fails `npm run typecheck` instead of a CI
step at runtime. `tools/media/tsconfig.json` extends the root for the media package, which has its
own dependencies (`npm run typecheck:media`, a CI step in the build job; installed with
`--ignore-scripts`, so no ffmpeg binary is downloaded).

**Prop forwarding.** `exactOptionalPropertyTypes` was dropped earlier because passing
`className={styles.x}` (typed `string | undefined`) into `className?: string` fails. The fix is at
the receiving side: component props that accept forwarded optional values declare
`prop?: T | undefined` (the same convention `@types/react` uses for DOM attributes). Two cases
needed more: `Resource.embedded` mirrors a Zod `.optional()` output (`boolean | undefined`), and
`CTAButton`'s link variant omits `onClick`/`onMouseEnter`/`onTouchStart` from the anchor attributes
because Next's `LinkProps` declares them without `| undefined` (a server CTA never carries handlers;
interactive buttons use `Button`).

### 3. TypeScript 7.0.2 as the only compiler

`typescript` is pinned to **7.0.2**; `tsc` is the native binary (the package installs a
per-platform `@typescript/typescript-<os>-<arch>` optional dependency; there is no separate `tsgo`
name any more). TypeScript 7.0 ships **no JavaScript compiler API** (`require("typescript")` only
exports the version), which matters in two places:

- **`next build`.** Next 16.3 type-checks by running the project's `tsc` CLI
  (`experimental.useTypeScriptCli`, default `true` since 16.3); only `useTypeScriptCli: false`
  needs the API. Next still writes `next-env.d.ts` and route types itself. So no TypeScript 5/6 is
  kept alongside 7. Observed: "Finished TypeScript in 2.0 s" in `next build`.
- **Editor.** Next's language-service plugin (`plugins: [{ "name": "next" }]`) and any
  "use workspace TypeScript" setting need the TS ≤ 6 API. VS Code's bundled TypeScript still runs
  the plugin; the TypeScript 7 native extension gives the new language server without it. The
  plugin entry stays because Next's config defaults write it back.

Type-check time (Windows, warm cache, same tree, `tsc --noEmit --incremental false` after
`next typegen`): TypeScript 5.9.3 total 8.0 s (check 4.1 s, 1751 files); TypeScript 7.0.2 total
2.2 s (check 0.9 s, 1758 files, 329 MB). Wall clock with `npx`: 7–15 s before, 3.7–6.6 s after;
`tsc -p tsconfig.node.json` adds 2.7–4.9 s. The whole tree also type-checks cleanly with 5.9.3, so
a rollback is a one-line pin change.

### 4. Exceptions (the only JavaScript left)

| File | Why it is not TypeScript |
|---|---|
| `next.config.mjs` | One line: `export { default } from "./config/next.ts"`; the configuration itself is `config/next.ts`. A root `next.config.ts` is loaded by Next either through Node's native loader, which Next only uses behind the `--experimental-next-config-strip-types` CLI flag, or by transpiling it with SWC to CommonJS; on Hostinger's GLIBC 2.28 image only the WASM SWC binding loads, and that path is reported to fail on `next.config.ts` (sources below). Hostinger's Node.js preset also wraps the config file to force `output: "standalone"`, a mechanism we cannot run in CI. The `.mjs` name keeps both unchanged, and Node 24 imports the `.ts` module natively (the same mechanism `npm run build` already relies on for `scripts/check-env.ts`). Verified in the Hostinger parity lane (GLIBC 2.28, WASM SWC, `build:standalone`, smoke). |
| `src/lib/cn-tables.js` | Generated and gitignored (`cn build` via `withCn`); typed by `cn-tables.d.ts`. |
| `postcss.config.json` | JSON, not code: Next reads `postcss.config.json`, knip's PostCSS plugin too; there is no TypeScript form Next loads. |

The three.js / GSAP scene (`src/motion/scene`) and the webpack `SceneBudgetPlugin` are TypeScript;
the plugin types the subset of the webpack 5 API it reads, because Next bundles webpack and types
its export as `any`.

## Consequences

- `.d.mts` shims are gone; the relay's types come from its implementation, and the unit tests are
  type-checked against it.
- New scripts and tests are written in TypeScript and run with `node file.ts`; a missing `.ts`
  extension, a runtime `enum` or a type-only import without `type` fails `npm run typecheck`.
- Node-run modules cannot use tsconfig `paths` for values; the application keeps its aliases.
- If a future Next release needs the compiler API again (for example `useTypeScriptCli: false`),
  add `"typescript": "npm:@typescript/typescript6@…"` next to TypeScript 7 as the TypeScript
  release notes describe, or pin 5.9/6.0.
- TypeScript 7.1 is expected to bring a new (different) API; revisit the editor plugin then.

## Sources (read 2026-09-24)

- TypeScript 7.0 announcement (GA 2026-07-08, no API in 7.0, `tsc` binary, TS 6 side-by-side
  packages): https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- TypeScript 6.0 announcement (new defaults such as `types: []`, deprecations removed in 7.0):
  https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- npm registry, `npm view typescript dist-tags` on 2026-09-24: `latest` 7.0.2, `next`
  7.1.0-dev.20260924.1; `@typescript/native-preview` frozen at 7.0.0-dev.20260707.2.
- Next.js `useTypeScriptCli`: https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli
  and the TypeScript page (native loader for `next.config.ts`):
  https://nextjs.org/docs/app/api-reference/config/typescript ; the 16.2 crash with TS 7 and the
  backport: https://github.com/vercel/next.js/issues/95649, https://github.com/vercel/next.js/pull/95831.
  Verified in `node_modules/next/dist/server/config-shared.js` (`useTypeScriptCli: true`) and
  `dist/build/next-config-ts/transpile-config.js` (native import only with the CLI flag, SWC
  otherwise).
- `next.config.ts` with the WASM SWC fallback on Hostinger: https://dev.to/paulovarassin/fixing-a-nextjs-16-deployment-on-hostinger-glibc-swc-and-webpack-278h
- Node.js type stripping (unflagged 22.18/23.6, warning removed in 24.3, stable in 24.12,
  erasable-only syntax, `.ts` extensions, no `paths`, not under `node_modules`):
  https://nodejs.org/docs/latest-v24.x/api/typescript.html ; `node --test` patterns:
  https://nodejs.org/docs/latest-v24.x/api/test.html
- `erasableSyntaxOnly`, `verbatimModuleSyntax`, `rewriteRelativeImportExtensions`,
  `allowImportingTsExtensions`, `exactOptionalPropertyTypes`,
  `noPropertyAccessFromIndexSignature`: https://www.typescriptlang.org/tsconfig/
