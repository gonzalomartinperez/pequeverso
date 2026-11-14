# Docs and community

Ecosystem section 14 applies. Current state: a very complete but dense documentation set (18 files in `docs/`, nine ADRs, spec files, verification evidence), a README with 8 badges and long assistant sections, partial community files. Facts that drift (counts, versions, environment URLs) are not written into prose.

## 1. README outline for this repo (ecosystem template, public variant)

1. **Title and one-line value:** "Pequeverso: a fast, kid-safe store site for printable learning kits (Next.js, Hotmart checkout)." Badges (three at most): CI, release, license.
2. **Why:** the problem (a parent on a phone needs to understand, trust and buy in a minute) and the design stance (honest proof, fast, privacy-respecting).
3. **Demo / Proof:** live site link, three screenshots (hub, kit hero, buy box) as `<picture>` where a second theme exists (not here: single light theme), scorecard summary and Lighthouse values from the latest nightly (generated, not hand-typed).
4. **Architecture:** C4 level 1 (visitor, store, Hotmart, assistant API, backoffice, vps-ops) and level 2 (app, consent, tracking relay, assistant slot) in Mermaid, generated from `docs/architecture/*.mmd` with the existing manifest check.
5. **Quickstart:** `nvm use && npm ci && cp .env.example .env.local && npm run dev` (one command target `npm run setup`).
6. **Usage:** `npm run check`, `npm run test:browser`, `npm run build:standalone`, how to change copy and facts (link to the how-to).
7. **Tech stack:** one table (Next 16, React 19, TypeScript 7, Tailwind 4, Base UI primitives, GSAP and three lazily, Playwright, Biome, knip).
8. **Quality:** scorecard summary and CI links.
9. **Documentation:** Diátaxis map (below).
10. **Roadmap:** link to `docs/master-plan/roadmap.md`.
11. **Contributing, Security, Support.**
12. **License:** code MIT; brand, copy and media all rights reserved (`LICENSE`, `LICENSE-CONTENT.md`).

The assistant section shrinks to a short note ("disabled in publishable builds") with a link to `docs/explanation/assistant.md`; the screenshot gallery moves to `docs/verification/`. A CI script checks the required headings.

## 2. Community files (public repo)

| File | State | Action |
|---|---|---|
| `LICENSE`, `LICENSE-CONTENT.md` | present | keep |
| `CONTRIBUTING.md` | long (style table and setup) | shorten to run checks, branch flow, commit convention; move the style table to `docs/reference/typescript-style.md` |
| `SECURITY.md` | present, **contact is an old-domain mailbox** (task M1-10, OD-53: fix before the domain expires on 2026-11-25) | rewrite from the standard template: private vulnerability reporting enabled, a Pequeverso-domain contact, 5-day acknowledgement; add `/.well-known/security.txt` (RFC 9116, expiry date renewed yearly by a calendar check) |
| `SUPPORT.md` | missing | add (points to `/soporte/` for customers and issues for bugs) |
| `CODE_OF_CONDUCT.md` | missing | add Contributor Covenant |
| Issue forms | missing | `bug.yml`, `feature.yml`, `blank_issues_enabled: false` |
| PR template | present | align with the ecosystem template (summary, linked issue, evidence, docs touched, agent docs touched, risk, rollback, screenshots) |
| `CODEOWNERS` | present (map) | extend to `docs/master-plan/`, `ratchets/`, `design/tokens/` |
| `CHANGELOG.md` | hand-written `[Unreleased]` | hand-curated; the version-bump PR moves it under the new version (ci-cd.md section 6, ADR-0018) |

All copies are synced from `engineering-standards` and drift-checked.

## 3. Documentation system (Diátaxis, no site generator)

| Quadrant | Target files (moves in `file-moves.md`) |
|---|---|
| Tutorials | `docs/tutorials/first-change.md` (clone, check, change a price in config, see the invariants test fail and pass) |
| How-to | `docs/how-to/{change-copy-and-facts,add-a-product,add-an-affiliate,update-media,run-the-checks,release-and-verify,rollback,handle-the-weekly-dependency-pr,verify-hotmart-checkout}.md` |
| Reference | `docs/reference/{architecture,design-system,tokens,commerce-config,edge-rules,tracking-and-consent,analytics-events,data-inventory,environment,budgets,typescript-style,ci-profile}.md` |
| Explanation | `docs/explanation/{why-hotmart-owns-checkout,conversion-page,identity,performance-model,assistant,legal-model,hosting}.md` |
| Decisions | `docs/decisions/ADR-NNNN-*.md` (MADR 4 with Confirmation section; stable paths; superseding ADRs link both ways) |
| Evidence | `docs/verification/` (kept small; large screenshot sets archived at M6 to a release asset with hashes) |
| Plan | `docs/master-plan/` (this folder) |

Existing files map onto the quadrants (`docs/development.md` to tutorial and how-to, `docs/design-system.md` to reference plus explanation, `docs/performance.md` to reference with its "documented 100" numbers replaced by generated values, etc.). Architecture diagrams stay generated from `docs/architecture/*.mmd` (existing manifest check) and also feed the README.

## 4. Docs CI

`docs` profile runs markdownlint-cli2, lychee (and weekly cron), README heading check, skills validator, ADR index check (no gaps, links both ways), docs-only PRs skip build and tests. Vale on English prose is optional (prose in ADRs and how-tos only; Spanish product copy is excluded).

## 5. Volatile facts

No hand-written counts or version numbers in prose: `docs/performance.md` tables come from `check:bundle` and Lighthouse JSON via a generator, the README badges link to workflows, test counts are not written. The ratchet files are the source.

## 6. Code docs

TSDoc on exported symbols that are not obvious from their type (existing convention); module-level comments say why; `docs/reference/commerce-config.md` is generated from the typed registry so config and docs cannot drift.
