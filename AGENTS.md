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
| Skills | `.agents/skills/*/SKILL.md` (canonical); `.claude/skills` are thin adapters |

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
- **Consent before marketing scripts.** The Meta Pixel loads only after "Aceptar". Every integration
  is a no-op when its `NEXT_PUBLIC_*` variable is empty, so a fresh clone builds and runs.
- **Placeholders `[[LIKE_THIS]]` are allowed in legal copy until the owner supplies the details**;
  the deploy workflow refuses to ship them.

## Workflow

- Branches: `type/kebab-case` (`feat|fix|chore|docs|refactor|perf|test|ci|build|revert`) → PR into
  `main` (protected ruleset; required check `ci`). Conventional Commits with a body that states what
  was verified and what was not.
- Before opening a PR: `npm run check` and the relevant `npm run test:e2e` projects. Keep
  `docs/generated/htaccess.txt` in sync (`node scripts/gen-htaccess.mjs`).
- One owner per lockfile change; dependency updates are their own PR.
- Releases are tags `vX.Y.Z` deployed manually through the `Deploy` workflow with environment
  approval; the workflow verifies the deployed commit, not just an HTTP 200.

## Boundaries

This repository does not contain, and must not import, private business knowledge, media masters,
WordPress backups, credentials or customer data. Sources for facts are cited in `docs/content-model.md`.
