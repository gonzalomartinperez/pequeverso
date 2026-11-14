# Progress log

Updated only at milestones. A drift check compares the ecosystem table below with the other repos of the nine.

## Current state

| Field | Value |
|---|---|
| Current milestone | M1 (in progress since 2026-11-14; M0 plans merged in PR #151) |
| Date | 2026-11-09 |
| `develop` SHA | `cbf519ce9c49f35a2536d4606520221a4a6debe0` (short `cbf519c`, committed 2026-10-19) |
| Live build measured | `cf61f20` (2026-11-09; production is `main` built by Hostinger) |
| Next item | **M0-1** (docs-only PR of this folder to `develop`), then **M1-10** (old-domain docs sweep, first in M1), then **M1-1** (CI profiles and `ci-gate`); consent opt-in is scheduled early in M3 (DR-01, no hotfix) |
| Pending owner inputs (3) | PV-D10 (one-time phone check of the live Hotmart checkout), PV-D11 (written family consent for proof), PV-D9 (dashboard steps); all other PV-D items resolved by delegation (README section 7). Not an owner input but flagged: a lawyer review of the legal pack is recommended before M7 (DR-07) |
| Known issues | F-01..F-18 in `audit.md` (P0: pixel before consent, live perf 31-55, withdrawal-by-email process not published) |

## In-flight tasks

Updated on every task merge (task ID, branch, PR, status as in `roadmap.md`). RESUME command: see `roadmap.md` section "Task status, IDs and RESUME command".

| Task ID | Branch | PR | Status | Last update |
|---|---|---|---|---|
| M1-10 | `docs/M1-10-old-domain-sweep` | #PRNUM | done (repo docs and `SECURITY.md` on `develop` no longer mention the old domain; `tests/unit/old-domain.test.ts` guards it; interim: support contact is the `config/site.ts` mailbox until a pequeverso.com mailbox exists) | 2026-11-14 |

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
| pequeverso (this repo) | v2 written | M0 | `develop` `cbf519ce9c49f35a2536d4606520221a4a6debe0` | Spanish-only store; consent opt-in ships at M7 |
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
