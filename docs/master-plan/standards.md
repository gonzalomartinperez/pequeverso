# Standards

Ecosystem section 10.1 (TypeScript) and 13 (design) apply. The repo is already close; this file lists the choice, each deviation with its reason, and the enforcement.

## 1. Style guide choice

Google TypeScript Style Guide for semantics, Biome for layout, as the ecosystem standard says. `CONTRIBUTING.md` already contains the adaptation table; it moves into `docs/reference/typescript-style.md` and `CONTRIBUTING.md` links to it (CONTRIBUTING becomes short per ecosystem 14.2).

| Topic | Ecosystem standard | This repo today | Decision |
|---|---|---|---|
| Layout | 2-space, 100 columns, double quotes, semicolons | 2-space, **110 columns**, double quotes, semicolons, trailing commas | Done in M1-8: one mechanical formatting commit at 100 columns, recorded in `.git-blame-ignore-revs` |
| Biome version | pinned exactly | `2.5.15` in `package.json`, `$schema` says `2.5.14` | Align the schema URL in M1 |
| Biome domains | `next`, `react`, `test`, `project` | `next`, `react` | Add `test` and `project`; add `noImportCycles`, `noPrivateImports`, `noUndeclaredDependencies`, `noRestrictedImports` for the guard rules in `target-state.md` section 3; `useSortedClasses` for Tailwind classes |
| Exports | named; default only for framework entry files and `*.config.ts` | same, with the Next.js list | keep |
| `interface` vs `type` | `type` for unions and mapped types, `interface` for extendable object shapes | `type` for props and unions, `interface` only when extension is the point | keep (compatible; stricter) |
| `enum`, `namespace`, parameter properties, decorators | forbidden | `erasableSyntaxOnly` enforces | keep |
| `undefined` vs `null` | `undefined` internally, `null` only at I/O boundaries | follows (`price: null` in the assistant contract) | keep |
| Compiler | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noImplicitOverride` | all present, plus `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` | keep |
| File naming | kebab-case; PascalCase only for exported components, types, classes | kebab-case | keep |
| Scripts and configs | `.mts`/`.ts` by type stripping; JS only where the tool cannot load TS | all `.ts`; one `.mjs` (justified) | keep; see `target-state.md` section 4 |
| Complexity | at most 10 per function, ratcheted | not measured | Biome `noExcessiveCognitiveComplexity` with a ratchet file; first run records the baseline, which may only fall |
| Docs | TSDoc on exported symbols; comments explain why | concise JSDoc convention | enforce for `config/` and `src/features/*/domain` with a unit test |
| Node | 26 LTS | 24 (Hostinger builder) | documented deviation D-11 |

## 2. Design standards (details in `design-playbook.md`)

Tailwind 4 with owned CVA primitives; the repo currently builds primitives from shadcn on Base UI (`@base-ui/react`), which ecosystem O4 describes as "replaces the research suggestion of Base UI/shadcn as a dependency". Decision (deviation, kept): Base UI stays as a runtime dependency **only for behaviour primitives that carry real accessibility logic** (dialog, accordion if used, tabs, tooltip, radio group, sheet). Reason: rewriting focus trapping, `inert` handling and typeahead is risk without benefit (O3). Re-evaluated in M5: any primitive not used on a public route is deleted, and tree-shaking is verified per route (`check:bundle`). Tokens move to DTCG JSON (D-06).

## 3. Language policy

Repo documentation, code, commits, ADRs, skills: English. Public copy under `content/es/` is neutral Latin American Spanish with tú, signed "Equipo de Pequeverso"; the invariants test enforces no voseo and no regionalisms. Owner-facing Spanish operational notes live only in `docs/es/` or `*.es.md`.

## 4. Enforcement

One command, `npm run check`, equals the CI static and unit job and the pre-commit hook; AGENTS.md lists the same commands and a test greps backticked commands in AGENTS.md against `package.json`. Ratchets in `ratchets/` only tighten. Rule changes need an ADR and an ecosystem version bump; no lint suppression without an issue (`biome-ignore` comments carry an issue number, enforced by a unit test; the current ignores for `dangerouslySetInnerHTML` move into the single serializer).
