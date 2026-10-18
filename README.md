# Pequeverso

Printable learning resources and curated courses for families: Grafismo Fonético for ages 3–7 and the third-party Guía de Alimentación para Bebés for 6–12 months. This repository contains the public store and its native shopping assistant; Hotmart handles payments, delivery and refunds.

[![CI](https://github.com/gonzalomartinperez/pequeverso/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/gonzalomartinperez/pequeverso/actions/workflows/ci.yml)
[![Nightly](https://github.com/gonzalomartinperez/pequeverso/actions/workflows/nightly.yml/badge.svg)](https://github.com/gonzalomartinperez/pequeverso/actions/workflows/nightly.yml)
[![Node 24 LTS](https://img.shields.io/badge/Node-24_LTS-43853d?logo=nodedotjs&logoColor=white)](https://github.com/nodejs/Release#release-schedule)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](package.json)
[![React 19](https://img.shields.io/badge/React-19-087ea4?logo=react&logoColor=white)](package.json)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](tsconfig.json)
[![Tailwind 4](https://img.shields.io/badge/Tailwind-4-0f6f83?logo=tailwindcss&logoColor=white)](docs/design-system.md)
[![Assistant disabled](https://img.shields.io/badge/Assistant-DISABLED-003068)](docs/assistant.md)

> **The assistant remains disabled in publishable builds.** No launcher, runtime or API traffic is emitted without explicit activation and a rebuild. Fixture previews demonstrate local behavior; they do not establish production readiness.
>
> Source code is MIT. Pequeverso brand, copy and media are all rights reserved: [LICENSE](LICENSE), [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

## Architecture at a glance

<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/architecture/system-dark.svg">
  <img src="docs/architecture/system-light.svg" alt="Pequeverso architecture: the kit opens its own landing; the affiliate course uses its configured Hotmart destination. The native assistant is disabled, and vps-ops owns future infrastructure.">
</picture>
</p>

[Open full-size diagram](docs/architecture/system-light.svg) ·
[Dark version](docs/architecture/system-dark.svg) ·
[Editable Mermaid and provenance](docs/architecture/README.md).

From Home, **Grafismo Fonético opens `/grafismo-fonetico/`**; the affiliate guide uses the
existing **`/alimentacion-bebe/` redirect to its producer**. Product selection adds no intermediate
landing or required in-page step. Hotmart owns payment, delivery and refunds. Dashed assistant
and infrastructure paths describe integration responsibilities, not a running VPS deployment.

The store presents **Grafismo Fonético** and the affiliate **Guía de Alimentación para Bebés**, with their respective format, audience and ownership clearly identified. The optional **Pack Imprime y Juega** remains a post-purchase offer. Product facts come from the [typed registry](config/products), [affiliate registry](config/affiliates.ts) and [commerce configuration](config/commerce.ts); copy never invents prices, guarantees or benefits. Offer pages embed the Hotmart sales-funnel widget; a thank-you URL is not proof of payment and exposes no product files.

Dependency direction, client/server separation, acyclic runtime imports and negative architecture
fixtures are enforced by the required CI build. See [engineering standards](docs/engineering-standards.md)
and run `npm run test:architecture` locally.

| Application | Responsibility | Operational boundary |
|---|---|---|
| This store | Public product pages, checkout links, native conversation UI | Static export by default; Node standalone also supported |
| [Assistant API](https://github.com/gonzalomartinperez/pequeverso-assistant-api) | Sessions, grounding, streaming, conversation persistence and provider credentials | Deployment belongs to vps-ops; no provider secret reaches this store |
| [Backoffice](https://github.com/gonzalomartinperez/pequeverso-backoffice) | Private administration and authenticated operations | Separate application; never a public chat iframe |
| vps-ops | VPS deployment, Coolify, reverse proxy and shared infrastructure | This repository supplies artifacts and contracts; it does not provision the VPS |

The owner confirmed that **Hostinger is connected to `main`** and automatically builds and publishes every merge. Verify the deployed SHA and `assistant: disabled` in `build-info.json`, then check `post-deploy-verify` and the live site; a source merge alone is not deployment evidence. [Build targets, routing and boundaries](docs/architecture.md) · [Hosting and deployment gates](docs/deployment.md).

## Native assistant

A star-only launcher opens a compact conversation panel on desktop and a comfortable viewport-aware surface on mobile. The assistant uses Pequeverso navy, cream, gold and teal; there is no independent dark/light theme. The interface is Spanish-only, with no language selector. It preserves history and drafts when minimized, resized or restored.

```mermaid
sequenceDiagram
  actor Visitor
  participant UI as Native UI (verification or authorized build)
  participant API as Assistant API
  Visitor->>UI: Open launcher
  UI->>API: Create session (credentialed CORS)
  API-->>UI: Secure HttpOnly cookie and CSRF token
  Visitor->>UI: Submit an explicit question
  UI->>API: POST /api/v1/messages + CSRF + idempotency key
  API-->>UI: HTTP/SSE reported events and content
  API-->>UI: Confirmed stored answer or safe terminal error
  UI->>API: Restore history after reload
```

Messages are rendered safely as text and supported formatting, with validated links, sources and product fields. The UI does not invent stages, tools, percentages, transactions or feedback endpoints. Interrupted or failed generations require an explicit visitor action; no automatic generation retry is added. Provider keys belong only to the backend.

| Build | Output | May be published? |
|---|---|---|
| Default: flag unset/false | Assistant compiled out; `build-info.json` says `disabled` | After normal release/deployment gates |
| Isolated local fixture build | `out-assistant-fixture/`, explicitly marked unpublishable | **Never** |
| Future enabled build | Requires reviewed API origin, owner authorization and verified VPS backend | Not authorized by this implementation |

[Behavior, contract and activation checklist](docs/assistant.md) · [Reproducible evidence and limitations](docs/verification/assistant.md).

### See the actual interface

These are original-resolution photographs of the **2026-10-17 local fixture build**,
showing the final reading polish and aligned controls. They are not an activated production assistant.

| Compact welcome and questions | Answer and sources |
|---|---|
| <a href="docs/verification/assistant/2026-10-17/desktop-welcome.png"><img src="docs/verification/assistant/2026-10-17/desktop-welcome.png" width="408" alt="Actual Spanish compact panel with suggested questions and input"></a> | <a href="docs/verification/assistant/2026-10-17/desktop-answer-sources.png"><img src="docs/verification/assistant/2026-10-17/desktop-answer-sources.png" width="408" alt="Complete fixture guarantee answer with two expanded source links and input"></a> |

[Mobile conversation](docs/verification/assistant/2026-10-17/mobile-conversation.png) ·
[Expanded desktop](docs/verification/assistant/2026-10-17/desktop-expanded.png) ·
[Gallery, exact revisions and hashes](docs/verification/assistant/2026-10-17/README.md).
The fixture API validates the local transport flow; these images do not validate real-model
commercial correctness. [Earlier 2026-10-12 states](docs/verification/assistant/2026-10-12/README.md)
retain their original provenance.

## Clean checkout

```bash
nvm use                         # Node 24 from .nvmrc
npm ci                          # Exact lockfile; lifecycle scripts disabled
cp .env.example .env.local       # Local sample configuration; assistant remains disabled
npm run dev                     # Local development
```

The site origin and checkout URL are required build-time configuration. The example checkout is a test value, not a production offer. Optional integrations have documented no-op behavior when their variables are empty; review [.env.example](.env.example) before using any real deployment values. No OpenAI key is required for the store or fixture suite.

```bash
npm run check                   # Lint, strict types, unit, export and budgets
npm run check:skills             # Canonical skill/adaptor consistency
npm run check:assistant-disabled # Inspect the actual publishable export
npx playwright install --with-deps chromium firefox webkit
npm run test:browser                 # Storefront browser gates against the built export
```

For assistant verification, use an **isolated API checkout** at the exact SHA in [tests/assistant/api-revision](tests/assistant/api-revision), run `uv sync --frozen` there, then:

```bash
ASSISTANT_API_DIR=/path/to/isolated-api-checkout npm run test:browser:assistant
```

This command builds the assistant separately and runs the real session/CSRF/HTTP/SSE flow with the fixture provider. It uses throwaway self-signed HTTPS loopback and an isolated database, never a provider key. Do not publish its output. [Full development commands](docs/development.md).

## Design and verification

- Next.js 16 App Router and React 19: Server Components by default, small client islands.
- Strict TypeScript, Tailwind 4, owned shadcn/Base UI primitives and CSS Modules for custom geometry.
- Self-hosted OFL Fraunces/Nunito Sans; shared design tokens and reduced motion.
- Node tests, Playwright across Chromium/Firefox/WebKit where applicable, axe and Lighthouse CI.
- Both static export and standalone parity are checked; budgets cover rendered output, media, bundle and scene behavior.
- Skills are reviewed procedures, never activation, payment or deployment authorization.

Measured runs and screenshots establish what was actually exercised. CI does not prove real Hotmart purchases, production cookie/proxy behavior, physical phone keyboards, field Core Web Vitals or real-model answer correctness. These remain separately recorded acceptance items.

## Repository map

| Path | Purpose |
|---|---|
| `src/app` | Public routes, legal/support pages, metadata and 404 |
| `config/products`, `config` | Product/commerce facts, budgets, assistant flag and edge rules |
| `src/shared`, `src/shell`, `src/views` | Named reused capabilities, existing page shell and page composition |
| `src/features/assistant` | Domain, controller, adapters and native presentation |
| `contracts/assistant-api` | Pinned API contract artifacts and provenance |
| `src/features/commerce`, `src/features/tracking` | Existing checkout and consent-gated events |
| `src/shared/motion` | CSS motion and lazily loaded scene with static fallback |
| `content/es` | Store and Spanish-only assistant copy |
| `media/manifest.json`, `tools/media` | Media provenance, rights and build-time pipeline |
| `scripts`, `tests`, `.github` | Build/publish guards, verification and protected workflow |
| `.agents/skills`, `.claude/skills` | Canonical .agents procedures and regular thin .claude references |

## Documentation and contribution

Start with [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Task branches originate from `develop`; task PRs squash into `develop`. An authorized `develop`→`main` release uses a merge commit with required checks and no protection bypass.

| Read | For |
|---|---|
| [Architecture](docs/architecture.md) | Data flow, build targets, routes and component boundaries |
| [Design system](docs/design-system.md) | Brand roles, typography, controls, accessibility and motion |
| [Assistant](docs/assistant.md) | Native runtime, compatible contract and activation conditions |
| [Development](docs/development.md) | Setup and verification commands |
| [Deployment](docs/deployment.md) | Hostinger modes, release artifacts and post-deploy evidence |
| [Content model](docs/content-model.md) | Approved business facts and registry rules |
| [Tracking](docs/tracking.md) | Consent and existing event ownership |
| [Media](docs/media.md) | Provenance, rights and asset budgets |
| [Decisions](docs/decisions) | Recorded architectural choices |
