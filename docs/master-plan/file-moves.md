# File moves, renames and deletions

Every move, rename, split, deletion or conversion of the 906 tracked files at `origin/develop` `cbf519c`, with its motive. The complete per-file table (kind, lines, target, action, reason) is `file-index.csv`. Rules that apply to every move (AGENTS.md "Physical module ownership"): reconcile ADR-0009, the consumer map, imports and aliases, generators, CI, tests, docs and skill pointers; preserve DOM, copy, styles, URLs, mount and cleanup lifetimes, consent, checkout and disabled-assistant gates; no forwarding barrels; moves are separate PRs from behaviour changes (one concern per PR, at most about 400 changed lines excluding generated files).

## 1. Moves, renames, splits, deletions

| From | To | Action | When | Motive |
|---|---|---|---|---|
| `.agents/skills/implement-feature/SKILL.md` | `.agents/skills/implement-task/SKILL.md` | rename+rewrite | M1 | Catalog name implement-task; design and copy parts split into evolve-design-system and change-content (skills.md) |
| `.agents/skills/prepare-delivery/SKILL.md` | `.agents/skills/verify-release/SKILL.md` | rename+rewrite | M1 | Stale after Hostinger main autodeploy and release-please (skills.md) |
| `.claude/skills/change-assistant/SKILL.md` | `.claude/skills/change-assistant` | convert-to-symlink | M1 | Relative symlink to ../../.agents/skills/change-assistant (ecosystem 15.1) |
| `.claude/skills/implement-feature/SKILL.md` | `.claude/skills/implement-task` | convert-to-symlink | M1 | Relative symlink to ../../.agents/skills/implement-task (ecosystem 15.1) |
| `.claude/skills/prepare-delivery/SKILL.md` | `.claude/skills/verify-release` | convert-to-symlink | M1 | Relative symlink to ../../.agents/skills/verify-release (ecosystem 15.1) |
| `.claude/skills/review-change/SKILL.md` | `.claude/skills/review-change` | convert-to-symlink | M1 | Relative symlink to ../../.agents/skills/review-change (ecosystem 15.1) |
| `.claude/skills/specify-feature/SKILL.md` | `.claude/skills/specify-feature` | convert-to-symlink | M1 | Relative symlink to ../../.agents/skills/specify-feature (ecosystem 15.1) |
| `docs/affiliates.md` | `docs/reference/affiliates.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/architecture.md` | `docs/reference/architecture.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/assets/shadcn-ui.md` | `docs/reference/third-party-assets.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/assistant.md` | `docs/explanation/assistant.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/ci-profile.md` | `docs/reference/ci-profile.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/code-quality.md` | `docs/reference/code-quality.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/content-model.md` | `docs/reference/content-model.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/dependency-updates.md` | `docs/how-to/handle-the-weekly-dependency-pr.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/deployment.md` | `docs/how-to/release-and-verify.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/design-system.md` | `docs/reference/design-system.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/development.md` | `docs/tutorials/first-change.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/engineering-standards.md` | `docs/reference/architecture-contracts.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/generated/htaccess.txt` | (deleted) | delete | M4 (PV-D3) | Static export retired (PV-D3, M4) |
| `docs/hotmart-funnel.md` | `docs/how-to/verify-hotmart-checkout.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/legal-checklist.md` | `docs/explanation/legal-model.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/media.md` | `docs/how-to/update-media.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/migration.md` | `docs/explanation/hosting.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/migration/old-domain.htaccess` | (deleted) | delete | M1 (M1-10) | Old domain retired, no redirects (OD-53); history kept in git |
| `docs/performance.md` | `docs/reference/performance.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/site-analytics.md` | `docs/reference/site-analytics.md` | move | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `docs/tracking.md` | `docs/reference/tracking-and-consent.md` | move+rewrite | M3-M4 | Diátaxis quadrant (docs-and-community.md section 3) |
| `src/app/api/meta/events/route.standalone.ts` | `src/app/api/meta/events/route.ts` | rename | M4 | pageExtensions trick unnecessary once export retired (M4) |
| `src/features/gallery/presentation/page-wall.module.css` | (deleted) | delete | M3 | Converted to token utilities (F-17) |
| `src/features/playground/presentation/playground.module.css` | (deleted) | delete | M3 | Converted to token utilities (F-17) |
| `src/features/site-analytics/domain/consent.ts` | `src/features/consent/domain/freshness.ts` | move | M3 / M4 | One consent module, one freshness rule |
| `src/features/tracking/adapters/consent.ts` | `src/features/consent/domain/consent.ts` | split | M3 / M4 | Policy pure in domain; storage adapter separate (ADR-0016); default false (PV-D1) |
| `src/features/tracking/presentation/consent-banner.tsx` | `src/features/consent/presentation/consent-banner.tsx` | move+rewrite | M3 / M4 | Equal buttons, opt-in copy, compact (playbook 3.2) |
| `src/features/tracking/presentation/cookie-settings-link.tsx` | `src/features/consent/presentation/cookie-settings-link.tsx` | move | M3 / M4 | Consent module owns it |
| `src/views/metadata.ts` | `src/views/seo/metadata.ts` | move | M3 | SEO module |
| `src/views/product-jsonld.ts` | `src/views/seo/product-jsonld.ts` | move+rewrite | M3 | Escaped serializer, seller, Organization and WebSite siblings |
| `tools/gen-htaccess.ts` | (deleted) | delete | M4 (PV-D3) | Static export retired (PV-D3, M4) |
| `tools/serve-static.ts` | (deleted) | delete | M4 (PV-D3) | Static export retired (PV-D3, M4) |

## 2. Bulk actions

| Set | Files | Action | Motive |
|---|---|---|---|
| `docs/verification/**` images (assistant fixture screenshots, text-zoom captures, visual evidence) | 57 | archive at M4 to a GitHub release asset (zip with SHA-256 list); the Markdown index and hashes stay in the tree | 20.1 MB of evidence screenshots inflate every clone; evidence stays reproducible from git history and the release asset (F-16) |
| `tests/browser/__screenshots__/**` | 12 | regenerate in the pinned Playwright image as route-region baselines | 12 full-page PNGs weigh 31.2 MB (largest 7.3 MB); region baselines at 0.01 diff ratio and a repo-size ratchet keep growth bounded |
| `.claude/skills/*/SKILL.md` | 5 | convert regular adapters to relative symlinks | ecosystem 15.1 |

## 3. JavaScript files (every `.js`, `.mjs`, `.cjs`)

| File | Destination |
|---|---|
| `next.config.mjs` (tracked) | kept as the single justified exception (Hostinger builder wraps this exact name; one-line re-export of `config/next.ts`) |
| `src/shared/styles/cn-tables.js` (generated, gitignored, not in the index) | stays generated; never tracked |

## 4. New files and folders (not in the index because they do not exist yet)

| Path | Purpose | Milestone |
|---|---|---|
| `docs/master-plan/**` | this plan | M0 |
| `ratchets/*.json` | committed baselines (guard, coverage, mutation, lighthouse, a11y, complexity, repo-size, design-lint, ci-duration, scorecard-axes, style, security, observability, docs) | M1 |
| `design/tokens/pequeverso.tokens.json`, `src/shared/tokens/theme.css` | DTCG source and generated CSS | M2 |
| `src/features/consent/**` | consent module (domain, adapters, presentation) | M4 (consent edits in place first (M3)) |
| `src/views/seo/{json-ld.tsx,organization-jsonld.ts,website-jsonld.ts}` | safe serializer and sibling structured data | M3 |
| `src/features/sample/**`, `src/features/proof/**` | sample download card; proof slot (only when assets exist) | M5 |
| `src/app/(dev)/_design/**` or equivalent behind `NEXT_PUBLIC_DESIGN_GALLERY` | state gallery | M2 |
| `src/app/accesibilidad/page.tsx`, `content/es/accesibilidad.ts` | accessibility statement | M3 |
| `public/.well-known/security.txt` | RFC 9116 | M1 |
| `tools/scorecard/**`, `tools/diff-coverage.ts`, `tools/deps-report.ts` | scorecard, diff coverage, dependency report | M1-M2 |
| `tests/unit/{design-lint,headers,ci-profile,seo,third-party}.test.ts`, `tests/perf/frames.spec.ts` | new guards and perf specs | M2 |
| `.github/workflows/{security,scorecard,release-please,deps-weekly-guard,drift}.yml`, `.github/ISSUE_TEMPLATE/*.yml`, `.github/release-please-config.json` | supply chain, release, community | M1 |
| `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `.codex/config.toml`, `.worktreeinclude`, `.git-blame-ignore-revs`, `standards.lock`, `ci-profile.json` | community, harness, drift | M1 |
| `docs/{tutorials,how-to,reference,explanation}/**`, `docs/assistant-activation.md` | Diátaxis and activation checklist | M3-M4 |
| `.agents/skills/{update-dependencies,write-adr,resume-refactor,score-repo,audit-visual,audit-accessibility,audit-performance,evolve-design-system,change-content,animate-scene,measure-conversion}/**` and `evals/` in every skill | skill catalog | M2 |
