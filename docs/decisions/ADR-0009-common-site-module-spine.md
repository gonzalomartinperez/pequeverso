# ADR-0009: Common public-site module spine

Date: 2026-10-18. Status: accepted for isolated implementation; verification and protected integration pending.

## Context and decision

The paired public sites share module responsibilities, while Pequeverso retains its commerce,
content, features, hosting and authorization boundaries. This increment starts at reviewed
header integration `88d6d0add414261e5ccf5bd3e2b21285e1a33179`; it changes physical paths and
consumer references, without changing product behavior or dependency/runtime pins.

Use `src/app` for framework routes and statically analyzed exports, `src/views` for page
composition, `src/shell` for navigation and the existing page shell, `src/features/<capability>`
for actual domain/application/adapters/presentation responsibilities, and named `src/shared`
capabilities for reused UI, styles, motion, media, identity, navigation and editorial components.
Root `config`, `content`, `contracts`, `media` and `tools` retain explicit owners; browser tests
and their unchanged screenshot baselines move together to `tests/browser`. No empty layers,
forwarding barrels, duplicated code or unused infrastructure are introduced.

Views compose feature presentation; client interaction state remains feature-owned. The hub's
sticky client bar and landing hero/gallery client components remain in feature presentation.
Hub product curation reads the server registry, media and deployment configuration, so belongs
in hub adapters. Price renderers are commerce presentation; configured social links belong to
shell. Catalog input/schema/registry remain build-time configuration under `config/products`;
that validator reads the public media manifest and is explicitly forbidden from client runtime.
The shared media capability retains its existing neutral manifest ownership; shared UI/styles
and motion do not gain product configuration dependencies.

The Meta relay moves to `features/tracking/adapters/server`; its standalone route and static
server remain thin outer consumers. `@server/*` targets that exact namespace. The checker must
follow transitive aliases, barrels, dynamic imports and type/runtime edges, reject the server
adapter and catalog from client runtime, and preserve legitimate erased type consumers.

## Skill discovery and consumer transition

The public-site pair retains canonical `.agents/skills` procedures and regular thin `.claude`
adapters. Shared names are specify-feature, implement-feature, review-change, prepare-delivery
and the actual product-specific change-assistant procedure. Each adapter has identical
frontmatter and only a reference to the canonical procedure. This is the sites' explicit
workflow convention, distinct from the APIs/backoffices; it does not claim one canonical
implementation for every repository category. Existing automatic descriptions and authorization
limits remain binding. Validators reject mismatched frontmatter, invalid references and duplicated
procedures; this decision does not impose a general ban on unrelated symbolic links.

All source, alias, CSS, generated table, CLI, TypeScript, Knip, CI, test and active documentation
consumers move atomically. `cn` continues to own one generated merge-table output with the exact
tracked declaration and generated path under `shared/styles`; its generator and consumers must
change together. Preserve the output's generated-only status. Browser discovery is compared
bijectively by old/new file, project and test title; opaque path-derived IDs may change.

## Invariants and acceptance

Shared modules cannot import features, views, shell or app. Features cannot import views,
shell or app. Existing assistant inward-layer restrictions remain. Classify every owned module,
including importless, alternate suffix, CSS and generated inputs; unknown roots, capabilities,
layers or root facades fail. Preserve current cycle, purity and client/server negative fixtures,
and add paired rejecting/accepting placement and relocated server/catalog closure cases.

Header/footer rendering remains in the existing per-route PageShell; file moves do not move
that composition into RootLayout. Preserve header anchor-scroll behavior, scroll restoration,
root-mounted assistant lifetime, observers, motion holds, lazy loading and HMR cleanup semantics.
No tracking, consent, checkout, public copy, pricing, contract bytes, assistant activation or
production action is authorized. Static export, Business standalone/GLIBC2.28 support, public URLs,
protected required contexts, browser projects/assertions/timeouts/retries and all budgets remain.

Historical verification receipts, ADR observations, contract copied_with values and scanner
commit:path fingerprints remain historical. This ADR supersedes the old physical-layout
instructions without rewriting their original evidence.

Closure requires normalized source equivalence, complete consumer/discovery checks, existing
repository checks and affected browser/assistant fixtures, independent exact-head review and
protected integration. Source-only checks do not establish build/browser or production acceptance.
