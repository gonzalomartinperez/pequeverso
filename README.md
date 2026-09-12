# Pequeverso

Commercial website for [pequeverso.com](https://pequeverso.com) — printable learning resources for
families with children aged 3–7. The site presents the **Grafismo Fonético** kit, the optional
**Pack Imprime y Juega**, and the post-purchase guidance page. Payments, delivery and refunds are
handled by Hotmart; this repository contains only the public website.

> Public visibility is not a licence to reuse the brand or content. Source code is MIT; brand,
> copy and media are all rights reserved — see [LICENSE](LICENSE) and [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

## Stack

- Next.js 16 (App Router, React Server Components, static export by default), React 19, TypeScript strict
- Plain CSS with design tokens and CSS Modules; self-hosted OFL fonts (Fraunces, Nunito Sans)
- Biome (lint + format), Node test runner, Playwright + axe, Lighthouse CI
- GitHub Actions CI on every PR; gated manual deploy that publishes the export to a `deploy` branch pulled by Hostinger Git, with revision verification

## Quick start

```bash
nvm use            # Node 24 (see .nvmrc)
npm ci             # exact lockfile, no lifecycle scripts
npm run dev        # http://localhost:3000
npm run check      # lint, types, unit tests, build, media and placeholder checks
npm run test:e2e   # Playwright against the static export
```

A fresh clone builds and runs without any secret: every integration (checkout URL, Meta Pixel,
analytics) is configured through `NEXT_PUBLIC_*` variables documented in [.env.example](.env.example)
and degrades to a documented no-op when empty.

## Repository map

| Path | Purpose |
|---|---|
| `src/app` | Routes (`/`, `/grafismo-fonetico/`, `/imprime-y-juega/`, `/grafismo-fonetico/gracias/`, legal, support, 404) |
| `src/components` | UI components (Server Components by default, small client islands) |
| `src/lib` | Tracking, consent, checkout parameters, metadata helpers |
| `content/es` | Typed Spanish copy per page |
| `config` | Site facts, commerce facts, edge rules (redirects/headers) |
| `media/manifest.json` | Provenance and rights for every published media file |
| `tools/media` | Build-time image/video pipeline (sharp, ffmpeg) — outputs are committed |
| `scripts` | Build info, `.htaccess` generator, static server, budget checks, smoke test |
| `tests` | Unit (`node --test`) and E2E (Playwright) |
| `docs` | Architecture, development, deployment, design system, content model, tracking, media, migration, legal checklist, ADRs |
| `.github` | CI, nightly matrix, deploy, branch policy, Dependabot |

## Documentation

Start with [AGENTS.md](AGENTS.md) (rules for humans and coding agents), then
[docs/architecture.md](docs/architecture.md). Decisions are recorded in `docs/decisions/`.

## Status

Verified by CI: lint, types, unit tests, static build, media budgets, Playwright smoke/a11y/offer-mode
specs, Lighthouse lab budgets. Not proven by CI: real Hotmart purchases, production deployment, field
Core Web Vitals — see [docs/deployment.md](docs/deployment.md) and [docs/migration.md](docs/migration.md).
