# Contributing

Read `AGENTS.md` first (non-negotiables, branch flow), then the doc for your task. This file
covers how code is written and checked; it does not repeat the commerce rules.

## Setup and checks

```sh
nvm use && npm ci
cp .env.example .env.local        # fake checkout URL; the assistant stays disabled
npm run check                     # lint, types, unit, knip, export build + budgets, rendered HTML
npm run test:e2e                  # Playwright PR set (installs: npx playwright install --with-deps)
npm run build:standalone          # Node target parity
```

The assistant suite (`npm run test:e2e:assistant`) needs a local checkout of
`pequeverso-assistant-api` at the revision in `tests/assistant/api-revision`; see
`docs/assistant.md`. It never uses a real key.

## TypeScript style

We follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
for readability, adapted to Next.js, React and this repository's tooling. Biome enforces the
mechanical parts; the rest is review.

| Google guide | Here |
|---|---|
| Named exports, no default exports | Same, **except** where Next.js requires a default export (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, metadata routes, `config/next.ts`) |
| `lowerCamelCase` file names | **kebab-case** file names (`price-block.tsx`), matching the design system's `data-slot` names and the Next.js route convention |
| `interface` for object shapes | `type` for props and unions (discriminated unions model states, e.g. the assistant's `Phase`); `interface` only when extension is the point |
| No `any`; narrow `unknown` | Same; payloads from the network are `unknown` until a runtime validator narrows them (adapters only) |
| Optional fields | `exactOptionalPropertyTypes` is on: forwarded optional props declare `| undefined` explicitly |
| Enums | Avoided: `erasableSyntaxOnly` is on (Node runs `.ts` by type stripping). Use `as const` objects and string unions |
| JSDoc on exported API | Concise JSDoc on exported symbols that are not obvious from their type; no narrative comments |
| Classes for stateful objects | Closures and plain functions (the assistant controller is a closure-based external store); React components are functions |
| Imports | `import type` for types; `.ts` extensions in files Node runs directly (`scripts/`, `server/`, unit tests); `@/` alias inside `src/` |
| Formatting | Biome (2-space indent, 100 columns, double quotes), not clang-format |

## Architecture boundaries

- Server Components by default; client islands only where the browser is required.
- Feature folders split pure `domain/`, framework-free `application/`, `adapters/` (HTTP,
  storage, validation) and `presentation/` (React); composition happens at the entry. The
  assistant's boundaries are checked by `tests/unit/assistant/boundaries.test.ts`.
- Business facts come from `config/` and `src/products`, never from component copy.
- No new dependency for something the platform or an existing dependency already does.

## Commits and pull requests

Conventional Commits; the body says what was verified and what was not. One owner per lockfile
change; dependency updates are their own PR. PRs target `develop` (squash). Releases to `main`
follow `.agents/skills/release/SKILL.md` and need the owner's approval each time.

## Agent skills

Canonical skills live in `.agents/skills/<name>/SKILL.md`; `.claude/skills/<name>/SKILL.md` are
thin adapters with identical frontmatter. `npm run check:skills` (also a unit test) validates
frontmatter, adapter drift, links, scripts, limits and the absence of private paths or secrets.
A skill is a procedure, never an authorization.
