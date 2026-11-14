# Progress log

Updated only at milestones. A drift check compares the ecosystem table below with the other repos of the nine.

## Current state

| Field | Value |
|---|---|
| Current milestone | M1 tasks merged 2026-11-14 (M1-6 sandbox run parked); waiting for the orchestrator's `checkpoint/M1` after the Monday Dependabot observation |
| Date | 2026-11-14 |
| `develop` SHA | `d1935a62e4158a501b00734f3a582d2763f4131f` (short `d1935a6`, after the last M1 task PR) |
| Live build measured | `cf61f20` (2026-11-09; production is `main` built by Hostinger) |
| Next item | **M2** after `checkpoint/M1`: start with M2-1 (production-config Lighthouse lane) and M2-9 (scorecard over `ratchets/`). Housekeeping: remove the `ci` alias job and the `ci` required check on 2026-11-21; confirm one Dependabot PR on 2026-11-16 (deps guard and vuln-daily first runs); triage the 6 CodeQL alerts; consent opt-in stays early in M3 (DR-01, no hotfix) |
| Pending owner inputs (3) | PV-D10 (one-time phone check of the live Hotmart checkout), PV-D11 (written family consent for proof), PV-D9 (dashboard steps); all other PV-D items resolved by delegation (README section 7). Not an owner input but flagged: a lawyer review of the legal pack is recommended before M7 (DR-07) |
| Known issues | F-01..F-18 in `audit.md` (P0: pixel before consent, live perf 31-55, withdrawal-by-email process not published). New in M1: 6 open CodeQL alerts (incomplete sanitization in `tools/lib/edge-rules.ts` and `tools/check-live.ts`, URL substring checks in two tests); flaky `offer-mode.spec.ts` sticky-bar test on chromium-768 (failed twice in one run, passed on a full re-run; re-running only failed jobs cannot work because the export artifact name carries the run attempt); `ratchets/repo-size.json` tracked-bytes ceiling already exceeded by about 32 KB of M1 files (M2-5 drops about 31 MB of screenshots) |

## In-flight tasks

Updated on every task merge (task ID, branch, PR, status as in `roadmap.md`). RESUME command: see `roadmap.md` section "Task status, IDs and RESUME command".

| Task ID | Branch | PR | Status | Last update |
|---|---|---|---|---|
| M1-10 | `docs/m1-10-old-domain-sweep` | #161 | done (repo docs and `SECURITY.md` on `develop` no longer mention the old domain; `tests/unit/old-domain.test.ts` guards it; interim: support contact is the `config/site.ts` mailbox until a pequeverso.com mailbox exists) | 2026-11-14 |
| M1-4 | `docs/m1-4-community-files` | #162 | done (security.txt, issue forms, PR template, SUPPORT, CODE_OF_CONDUCT, CODEOWNERS; private vulnerability reporting enabled) | 2026-11-14 |
| M1-5 | `docs/m1-5-standalone-adr` | #164 | done (ADR-0010 supersedes ADR-0001; AGENTS, README, architecture, deployment and development docs say standalone is production). Deviation: the PR-path CI inversion moves to M4-2 (see roadmap) | 2026-11-14 |
| M1-1 | `ci/m1-1-ci-profiles` | #166 | done (classify + `ci-gate` from engineering-standards v1.0.0; profile coverage test; docs fast path) | 2026-11-14 |
| M1-2 | `ci/m1-2-deps-guard` | #168 | done (deps-weekly-guard and vuln-daily callers; grouped-rule test) | 2026-11-14 |
| M1-3 | `ci/m1-3-supply-chain` | #165 | done (dependency review, SBOM artifact, Scorecard; CodeQL and SHA pinning settings) | 2026-11-14 |
| M1-6 | `ci/m1-6-release-please` | #167 | in-progress (merged; sandbox run parked on the owner token) | 2026-11-14 |
| M1-7 | `chore/m1-7-skill-symlinks` | #163 | done | 2026-11-14 |
| M1-8 | `chore/m1-8-line-width-100` | #172 | done (Biome 2.6.7 in #170; 100-column reformat in `.git-blame-ignore-revs`) | 2026-11-14 |
| M1-9 | `chore/m1-9-ratchets` | #169 | done | 2026-11-14 |

## Scorecard snapshot (planner baseline 2026-11-09; first independent re-score at M3)

| Lens | Axis scores | Minimum |
|---|---|---|
| Developer | D1 88, D2 84, D3 70, D4 72, D5 62, D6 52, D7 55, D8 66 | 52 (D6) |
| Designer | P1 86, P2 80, P3 82, P4 90, P5 85, P6 90 | 80 (P2) |
| CRO | C1 74, C2 68, C3 80, C4 35, C5 90, C6 72, C7 30 | 30 (C7) |

Measured inputs: unit 277/277, coverage L 96.19 / B 88.11 / F 92.78, knip clean, build 61 s, Lighthouse mobile home 55 (LCP 4.4 s, TBT 2.1 s), kit page 31 (LCP 10.1 s, TBT 6.6 s), upsell 49, axe 2 serious on `/imprime-y-juega/`, Meta Pixel 209 KB and 2.1 s at first paint, HSTS 300, `/_next/static` 4 h cache, home JS headroom 0.2 KB gz.

## Ecosystem status (nine repositories; identical table in every repo)

| Repo | Plan | Milestone | Branch and SHA at planning (`git rev-parse origin/<branch>` after `git fetch -q`, 2026-11-09) | Notes |
|---|---|---|---|---|
| portfolio | v2 written | M0 | `develop` `0a1ff564f66475a1d9a360a9c927ac804accbf83` | bilingual site; hero particle system v2 |
| portfolio-assistant-api | v2 written | M0 | `develop` `e749ca762fb3f1e74225d9126d4eb1bbd88e2885` | RAG assistant API; eval and typing debt |
| portfolio-backoffice | v2 written | M0 | `develop` `e356b13d81d509e640b3b318c0d37c7b4abcce1c` | assistant and site analytics ops |
| pequeverso (this repo) | v2 written | M1 (tasks merged 2026-11-14) | `develop` `cbf519ce9c49f35a2536d4606520221a4a6debe0` | Spanish-only store; consent opt-in ships at M7 |
| pequeverso-assistant-api | v2 written | M0 | `develop` `6912579245506bbd60f745243905ce4974dfbfe9` | Spanish-only shopping assistant API; golden set and judge validation |
| pequeverso-backoffice | v2 written | M0 | `develop` `4d4fb9633f2d355ed80b3f05407cbd3a2a5cf5e0` | local folder `pequeverso-assistant-backoffice` |
| vps-ops | v2 written | M0 | `main` `f52c3e693250b17a2f8783f83cf1b5bf8097f238` | private, main-only; VPS not bought |
| pequeverso-marketing | v2 written | M0 | `main` `7d26bf4240c9034e339ee4545e5f883c75fd816f` | private, main-only; Spanish plan |
| dropshipping-ops | v2 written | M0 | `main` `8ff028365944ee69ef47fd7a871b1b63da4be089` | private, main-only; exploratory business line |

(SHAs read with `git -C <repo> rev-parse origin/<branch>` after `git fetch -q` on 2026-11-09; each repo's own plan records its own at M0.)

## Milestone log

| Milestone | Date | `develop` SHA | Scorecard snapshot | What changed | Next | Known issues | Pending decisions |
|---|---|---|---|---|---|---|---|
| M0 | 2026-11-09 | `cbf519c` | baseline above | Plan written, not yet merged | merge docs PR; owner answers decisions | audit findings F-01..F-18 | PV-D10, PV-D11, PV-D9 owner inputs |
| M1 | 2026-11-14 | `d1935a6` | baseline (unchanged; ratchets in `ratchets/`) | M1-1..M1-10 merged (PRs #161-#170, #172); CI profiles with `ci-gate`; weekly Dependabot guard and vuln-daily; dependency review, SBOM, Scorecard, CodeQL; release-please (disabled); community files; ADR-0010; skills symlinks; Biome 2.6.7 and 100 columns; ratchets | M2 after `checkpoint/M1` | CodeQL alerts (6), one flaky browser test, repo-size ratchet exceeded | owner: RELEASE_PLEASE_TOKEN + sandbox (M1-6); PV-D10, PV-D11, PV-D9 |
