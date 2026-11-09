# Dependencies

Policy (ecosystem section 7): a new runtime dependency passes an ADR with need versus platform, health (Scorecard and deps.dev), licence allow-list (MIT, Apache-2.0, BSD, ISC, 0BSD, BlueOak), bundle cost over 10 kB gz justified, maintainers, exit cost. Versions below are from `package.json` at `cbf519c`. Health, advisories and licence cells marked "M1 script" are filled by a script in M1 (`tools/deps-report.ts`: deps.dev, Scorecard API and `npm audit`) because this plan did not verify them against live registries; the `npm audit --omit=dev --audit-level=high` step is already green in CI.

## Runtime

| Package | Version | Purpose | Alternatives | Cost (gz) | Licence | Decision |
|---|---|---|---|---|---|---|
| `next` | 16.4.2 | App Router, static rendering, standalone server | Astro (static content site; rewrite, not justified) | framework chunks about 64 KB (`794-*`) plus `react-dom` 62 KB | MIT | Keep; subscribe to monthly security releases (out-of-band releases 2026-09-22 and 2026-10-14, [01] section 8); minor and patch only (majors ignored in Dependabot) |
| `react`, `react-dom` | 19.3.1 | UI | none | `react-dom` about 62 KB | MIT | Keep |
| `@base-ui/react` | 1.9.0 | Accessible behaviour primitives (dialog, accordion, tabs, tooltip, radio group) | Radix, hand-written | in route chunks; verify per route | MIT (M1 script) | Keep as a deviation (standards.md section 2); delete unused primitives; verify tree-shaking per route |
| `class-variance-authority` | 0.7.1 | Variant API for owned primitives | Tailwind Variants | under 1 KB | Apache-2.0 | Keep (ecosystem O4 names CVA) |
| `cn` | 0.4.0 | Compiles Tailwind class-merge tables at build (`withCn`), generates `cn-tables.js` | `tailwind-merge` (runtime, about 7 KB) | 0 runtime bytes for tables | M1 script | Keep; confirm licence and maintainers in M1; exit cost: `tailwind-merge` |
| `zod` | 4.6.7 | Product registry schema at build; assistant contract validation | Valibot | server side mostly; check client graph | MIT | Keep; stays out of client graph (guarded) |
| `gsap` | 3.15.0 | Lazy timelines, scene, fallback scroll effects | CSS and WAAPI only | core 19.5 KB plus ScrollTrigger 17 KB in the deferred chunk | "Standard no-charge" licence since 2025 (check the text before relying on it commercially, [13] 2.1) | Keep lazily; after D-03 it loads on desktop only |
| `three` | 0.186.1 | Deferred starfield scene | static SVG only | scene closure 177.6 KB (cap 250 KB) | MIT | Keep, desktop fine pointer only after first interaction (D-03); revisit removal if analytics show no effect on conversion |
| `embla-carousel-react` | 8.6.0 | Gallery carousel | CSS scroll-snap | 7 KB | MIT | **Remove** (M3): CSS scroll-snap carousel; saves about 7 KB on the product page, which needs to fall from 174.5 to at most 170 KB |
| `lucide-react` | 1.55.0 | Icons | inline SVG sprite | 7.8 KB total for used icons | ISC | Keep; evaluate a sprite in M3 only if the JS budget still needs bytes |

## Development

| Package | Version | Purpose | Decision |
|---|---|---|---|
| `typescript` | 7.0.2 | `tsc` gate | Keep; Stryker alias to TS 6 until 7.1 if needed |
| `@biomejs/biome` | 2.5.15 | Lint and format | Keep, pinned; align `$schema`; enable the guard rules (standards.md) |
| `@playwright/test` | 1.64.1 | Browser tests (Dependabot ignores the single bad 1.64.0) | Keep |
| `@axe-core/playwright` | 4.13.0 | Accessibility | Keep |
| `@lhci/cli` | 0.15.1 | Lighthouse CI; needs four security `overrides` (`tmp`, `uuid`, `qs`, `basic-ftp`) | Spike in M2: replace with the `lighthouse` package plus the repo's own assertion script (`tools/lhci-summary.ts` exists) to drop the overrides; keep until proven |
| `knip` | 6.41.0 | Dead code | Keep |
| `oxc-parser` | 0.153.0 | Import parsing in the architecture test | Keep |
| `tailwindcss`, `@tailwindcss/postcss`, `postcss` | 4.3.3, 4.3.3, 8.5.30 | Styling pipeline | Keep |
| `@next/bundle-analyzer` | 16.4.2 | `npm run analyze` | Keep (dev) |
| `cross-env` | 10.1.0 | Env in scripts | Remove at M4 (authoring on WSL and CI on Linux; `NODE_ENV`-style prefixes work) |
| `@types/*` | various | Types | Keep; `@types/node` follows Node 24 |

## Proposed additions (each needs its ADR)

| Package or tool | Need | Alternative | Cost | Licence | Decision |
|---|---|---|---|---|---|
| `style-dictionary` v5 (or Terrazzo) | DTCG tokens to generated `theme.css` | hand-written CSS | dev only | Apache-2.0 | Add (M2) after a one-hour comparison with Terrazzo; ADR-0012 |
| `fast-check` | Property-based tests | hand-rolled loops | dev only | MIT | Add (M2) |
| `@stryker-mutator/core` plus `tap-runner` (or Vitest runner) | Mutation | none | dev only | Apache-2.0 | Add after spike E7 (ADR-0015) |
| `schema-dts` | Typed JSON-LD | hand types | dev only | Apache-2.0 | Add (M3) |
| `web-vitals` | RUM at MV | none | about 2 KB | Apache-2.0 | Add at MV, lazy, consent-independent only if it sends no identifier (verify) |
| `cspell` with an `es` dictionary | Spelling in copy | LanguageTool | dev only | MIT | Add (M2) |
| `@cyclonedx/cyclonedx-npm` (or Syft) | SBOM | none | CI only | Apache-2.0 | Add (M1) |
| Diff coverage | Diff coverage gate | `diff-cover` (Python) | none | n/a | Own 80-line TypeScript script over lcov and `git diff` (avoids a Python toolchain in a TS repo) |
| Umami or Plausible | Cookieless counter | none | script about 2 KB; spend decision | MIT (Umami) / AGPL (Plausible, self-host) | PV-D4 |
| Style-guard helpers from `engineering-standards` | Biome preset, tsconfig base | local | none | MIT | Copy with hash check (E14) |

## Policy applied to the weekly PR

Single group; cooldown 7 days default, 21 major, 3 patch (long values because Hostinger deploys straight to production); framework packages get a changelog read by the `update-dependencies` skill before the owner merges; no automerge; vulnerabilities between Mondays use the manual task-branch path and do not create a second Dependabot PR (ecosystem 5.5).
