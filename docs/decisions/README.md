# Architecture decision records

One file per decision, `ADR-NNNN-title.md`, with stable paths. A superseding ADR links the
superseded one and the superseded one links back. `tests/unit/adr-index.test.ts` keeps this index
complete (every ADR listed once, title and status word matching) and checks that backticked
repository paths in non-superseded ADRs exist or the ADR carries a `Path note`. Numbers need not be
contiguous (ADR-0018 follows the numbering of the ecosystem plan).

| ADR | Title | Status |
|---|---|---|
| [ADR-0001](ADR-0001-hosting-target.md) | Hosting target: static export on a Hostinger website, Node app as fallback | superseded by ADR-0010 |
| [ADR-0002](ADR-0002-product-registry.md) | Product registry with per-product routes | accepted |
| [ADR-0003](ADR-0003-tracking-adapters.md) | Tracking adapters behind consent | accepted |
| [ADR-0004](ADR-0004-ci-topology.md) | CI topology: one build per pull request, verification on main | accepted |
| [ADR-0005](ADR-0005-conversions-api-relay.md) | Meta Conversions API relay inside our own Node server | accepted |
| [ADR-0006](ADR-0006-shadcn-tailwind-design-system.md) | Tailwind CSS v4 + shadcn/ui (Base UI) design system | accepted |
| [ADR-0007](ADR-0007-typescript-everywhere.md) | TypeScript everywhere, strictest flags, TypeScript 7 | accepted |
| [ADR-0008](ADR-0008-native-assistant.md) | Native shopping assistant, disabled by default, on a separate API origin | accepted |
| [ADR-0009](ADR-0009-common-site-module-spine.md) | Common public-site module spine | accepted |
| [ADR-0010](ADR-0010-standalone-production-target.md) | Production target is the Hostinger Node.js Web App (standalone) | accepted |
| [ADR-0014](ADR-0014-csp-enforcement.md) | Enforce the Content-Security-Policy, keeping inline scripts for now | accepted |
| [ADR-0015](ADR-0015-mutation-tooling.md) | Mutation testing with StrykerJS on node:test (E7 spike outcome) | accepted |
| [ADR-0018](ADR-0018-release-automation-version-pr.md) | Release automation by version-bump PR and a tagging workflow | accepted |
