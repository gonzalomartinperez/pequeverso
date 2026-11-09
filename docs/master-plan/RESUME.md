# RESUME: pequeverso master plan (read this first, no chat access needed)

## What this is

A planning-and-execution brief to refactor `gonzalomartinperez/pequeverso` (the public store site for printable kits sold through Hotmart; Next.js 16, TypeScript 7, Tailwind 4) to a measured excellence standard: fast, kid-safe, privacy-respecting, conversion-first. It is one of nine repos that follow the same ecosystem standard (`ecosystem.md`). The plan was written on 2026-11-09. Production (`pequeverso.com`) is the Hostinger Node.js app built from `main` on every merge; it does not change before M7 (no hotfixes, DR-01). The live site and Hotmart already use only `pequeverso.com`; only repo docs and `SECURITY.md` on `develop` still mention the old domain, fixed first in M1 (M1-10, DR-14).

## Read order

1. This file, then `progress.md` (current milestone and next item).
2. `README.md` (decisions; PV-D1..PV-D12 resolved by delegation), then `owner-decisions.md` and `owner-decisions-existing.md` (binding registers; read before acting on anything they cover).
3. `roadmap.md` (find the first `todo` row of the current milestone).
4. `audit.md` (why), `scorecard.md` (targets), `target-state.md` (architecture, build target), `design-playbook.md` and `cro.md` (for design and conversion work), `testing.md`, `ci-cd.md`.
5. `ecosystem.md` and `rubrics.md` (never edit; they are byte-identical copies).
6. The repo's own `AGENTS.md`, `docs/architecture.md`, `docs/tracking.md`, `docs/legal-checklist.md` before touching code.

## Find the true next task (mid-milestone)

```bash
M=M3   # current milestone prefix from progress.md
git log --oneline --grep "$M-"
gh pr list --state all --search "$M- in:title" --json number,title,state
grep -n "^| $M-.*| todo |" docs/master-plan/roadmap.md | head -1   # first todo row
```

A row marked `todo` with an open PR is `in-progress`: continue that PR. `progress.md` section "In-flight tasks" lists the current ones.

## First commands

```bash
cd ~/projects/github/gonzalomartinperez/pequeverso
git fetch -q && git switch develop && git pull --ff-only
git tag --list 'checkpoint/*'                         # last safe point
sed -n 1,40p docs/master-plan/progress.md
nvm use && npm ci && cp .env.example .env.local
npm run check                                           # must be green before you change anything
gh pr list --state open --json number,title,headRefName # expect at most one dependency PR
```

## Ready-to-paste prompt for any Claude account

> You are continuing the Pequeverso master refactor. Work only in `~/projects/github/gonzalomartinperez/pequeverso`. Read `docs/master-plan/RESUME.md`, then `progress.md`, then the first `todo` row of the current milestone in `roadmap.md` (use the RESUME command above). Implement it in a short-lived branch `<type>/<milestone>-<slug>` from fresh `origin/develop`, with tests at the right layer and the acceptance criteria met with evidence. Open a PR to `develop`, wait for green `ci-gate`, run the independent review chain (reviewer agent, then a second-model review, architecture review for structural changes), and merge only with `gh pr checks --watch && gh pr merge`. Update `progress.md` and set the roadmap Status to `done (PR #, SHA)`. Never touch `main`, never use `--admin`, never commit secrets, never enable the assistant, never invent prices, guarantees, testimonials or claims (facts come from `config/`). Every PV-D decision is resolved (README section 7); stop and ask the owner only for the three owner inputs below or an always-owner-only item. Report in Spanish at the end of the block of work.

## Owner-only decisions (never decide for the owner)

Owner inputs still needed (3, same list as README section 7 and `progress.md`): PV-D10 phone check of the live Hotmart checkout, PV-D11 consented proof from real families, PV-D9 dashboard steps. Every other PV-D item is Resolved (delegated, 2026-11-09; README section 7). Always owner-only (ecosystem 15.4): any production activation, any spend, commercial and legal facts, promotion `develop` to `main`, hotfix authorization, manual merge of the weekly dependency PR, granting tokens or GitHub App scopes, accepting a vulnerability exception.

## Non-negotiable rules

- Branch flow: task branch, PR to `develop`, green `ci-gate`, merge commit (no squash) with a Conventional Commit PR title; `main` only at M7 (coordinated release). No hotfixes before M7 (DR-01, OD-11): the consent opt-in is built early in M3 on `develop`.
- Merge only with green CI: `gh pr checks --watch && gh pr merge`; never chain with `;`; never `--admin`.
- Audience and domain: Spanish-only store (OD-32); only `pequeverso.com` and its mailbox, never `digitalproductsteam.com` (OD-53, DR-14; live site already clean, repo docs and `SECURITY.md` fixed in M1-10 on `develop`, no hotfix); guarantee 7 days with longer legal windows honored by email (OD-50); production is standalone only (DR-08).
- GitHub identity: `gonzalomartinperez` only in commits and `gh`; never the secondary account.
- No secrets in git, logs, images or build args; the Meta pixel id is a public value but the CAPI token is server-only in hPanel.
- Hotmart owns payment, delivery and refunds; the site never emits `InitiateCheckout` or `Purchase`.
- Business facts live in `config/`; copy never invents testimonials, counts, urgency, outcomes or health claims.
- The assistant stays disabled and compiled out of publishable builds.
- Dependabot: exactly one weekly PR (Monday 09:00 America/Argentina/Buenos_Aires), all ecosystems together, target `develop`; never two open at once; the owner merges it manually.
- Never `pkill -f` (kill by verified PID). Destructive commands are blocked by guard hooks; do not work around a block.
- A merged PR and green CI do not prove deployment: verify `https://pequeverso.com/build-info.json` against the merge SHA.
- Repo docs in English; public copy in neutral Latin American Spanish with tú, signed "Equipo de Pequeverso".
- The seller's personal and tax data stay in `content/es/legal/seller.ts` only; never copy it into plans, issues or logs.
