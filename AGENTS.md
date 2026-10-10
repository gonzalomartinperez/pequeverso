# Agent guide — pequeverso

Public repository for the Pequeverso commercial website (Next.js 16 App Router, static export,
Hostinger, Hotmart checkout). Engineering language is English; customer-facing copy is neutral
Spanish. Read this file first, then the doc that matches your task.

## Start here

| Task | Read |
|---|---|
| Understand the system | `docs/architecture.md` |
| Run, build, test locally | `docs/development.md` |
| Change copy, prices, product facts | `docs/content-model.md` (and `config/commerce.ts`) |
| Visual work | `docs/design-system.md` |
| Images, video, fonts | `docs/media.md` |
| Events, pixel, consent | `docs/tracking.md` |
| Legal/support pages | `docs/legal-checklist.md` |
| Release or deploy | `docs/deployment.md` |
| URL changes, redirects, cutover | `docs/migration.md` |
| Hotmart funnel (checkout, widget, dashboard changes, E2E checklist) | `docs/hotmart-funnel.md` |
| Native shopping assistant (disabled by default) | `docs/assistant.md`, ADR-0008 |
| Code style, setup, skills validation | `CONTRIBUTING.md` (Google TS style adaptations); skills: `.agents/skills/*/SKILL.md` (canonical), `.claude/skills` thin adapters, `npm run check:skills` |

## Non-negotiables

- **Hotmart owns payment, delivery and refunds.** The principal CTA opens the configured checkout;
  upsell/downsell decisions belong to the Hotmart sales-funnel widget (one `#hotmart-sales-funnel`
  container per page, never a direct checkout link for post-purchase offers). The site never emits
  `InitiateCheckout` or `Purchase`. A thank-you URL is not proof of payment; never expose files.
- **Business facts are configuration, not copy.** Prices, composition, guarantee period, checkout
  URL and social profiles live in `config/`. Do not invent testimonials, results, guarantees or claims.
- **Both build targets must keep working.** Static export (default) and `NEXT_OUTPUT=standalone`.
  No `proxy.ts`, no request-time APIs, no runtime image optimization. Redirects and headers only in
  `config/edge-rules.json` (rendered to `.htaccess` and `next.config`).
- **Media enters the repo only through `tools/media` with a `media/manifest.json` record** (source
  path outside the repo, provenance, rights, export parameters). Never commit originals, product
  PDFs, backups or anything with unresolved rights. Budget: 5 MB per file, 25 MB total.
- **Accessibility and performance are acceptance criteria**, not polish: WCAG 2.2 AA (contrast,
  focus, 24 px targets, reduced motion, captions/text alternatives), CLS ≤ 0.1, LCP ≤ 2.5 s (lab).
- **Deployment values live only in environment variables.** The repository ships no inline
  origin, checkout URL, pixel id or token: `NEXT_PUBLIC_SITE_URL` and the checkout URL are
  required at build time (`scripts/check-env.ts`; copy `.env.example` to `.env.local` locally),
  optional integrations are no-ops when their variable is empty. The Meta Pixel runs when its id is
  set and the cookie banner withdraws it.
- **TypeScript first.** Every file we write is TypeScript under the strict tsconfig (TypeScript 7,
  `exactOptionalPropertyTypes`, `erasableSyntaxOnly`); scripts, server code and unit tests run as
  `node file.ts` (erasable syntax, `.ts` import extensions, `import type`). The only JavaScript is
  the one-line `next.config.mjs` re-export of `config/next.ts` (ADR-0007).
- **The native assistant stays disabled.** `NEXT_PUBLIC_ASSISTANT_ENABLED` is unset/`false` in every
  publishable build; enabling it needs the owner's explicit authorization and a rebuild. Enabled
  builds (`npm run test:e2e:assistant`, `out-assistant-fixture/`) are verification artifacts only;
  `npm run check:assistant-disabled` must pass on anything that ships. The assistant is advisory:
  no checkout, payment, cart or tracking features (`docs/assistant.md`).
- **Placeholders `[[LIKE_THIS]]` are allowed in legal copy until the owner supplies the details**;
  the deploy workflow refuses to ship them.

## Workflow

- Branches: `develop` is the integration branch (default); `main` is production (Hostinger builds
  it on every merge). Work on `type/kebab-case` (`feat|fix|chore|docs|refactor|perf|test|ci|build|revert`)
  → squash PR into `develop`. A release is a PR `develop` → `main` merged with a **merge commit**
  (keeps the shared history, so the next release merges cleanly). Hotfix: `fix/…` → PR into `main`,
  then a PR `main` → `develop` (merge commit). Both branches are protected rulesets (required
  checks `ci` + `Branch policy`). Conventional Commits with a body that states what was verified
  and what was not.
- Before opening a PR: `npm run check` and the relevant `npm run test:e2e` projects. Keep
  `docs/generated/htaccess.txt` in sync (`node scripts/gen-htaccess.ts`).
- One owner per lockfile change; dependency updates are their own PR.
- Releases are tags `vX.Y.Z` deployed manually through the `Deploy` workflow with environment
  approval; it publishes the export to the `deploy` branch (pulled by Hostinger Git) and verifies
  the deployed commit, not just an HTTP 200. Never commit to `deploy` by hand.

## Boundaries

This repository does not contain, and must not import, private business knowledge, media masters,
WordPress backups, credentials or customer data. Sources for facts are cited in `docs/content-model.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
