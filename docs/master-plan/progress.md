# Progress log

Updated only at milestones. A drift check compares the ecosystem table below with the other repos of the nine.

## Current state

| Field | Value |
|---|---|
| Current milestone | M3 tasks merged or parked 2026-11-14 (M2 finished in the same run); waiting for the orchestrator's `checkpoint/M3` |
| Date | 2026-11-14 |
| `develop` SHA | `6b6b682` (after #208; this docs PR follows) |
| Live build measured | `cf61f20` (2026-11-09; production is `main` built by Hostinger) |
| Next item | **M4** after `checkpoint/M3`: M4-1 guards (needs M3-C2/C3, merged) and M4-2 static-export retirement. Before 2026-11-28: calibrate `ratchets/interaction.json` from three CI runs with `tools/interaction-suggest.ts` and set `calibrated: true` (otherwise `tests/unit/ratchets.test.ts` turns develop red on 2026-11-29). Housekeeping: remove the `ci` alias job and required check on 2026-11-21; confirm the Monday 2026-11-16 Dependabot PR; check the first nightly with iPhone 15 and Pixel 7 against the 45-minute budget |
| Pending owner inputs (3) | PV-D10 (one-time phone check of the live Hotmart checkout), PV-D11 (written family consent for proof), PV-D9 (dashboard steps: HSTS one year, Cloudflare beacon); also flagged by the M3 re-score: a pequeverso.com support mailbox (today gmail.com) and PV-D6 (free sample). RELEASE_PLEASE_TOKEN is no longer needed (OD-78, ADR-0018 version-PR flow). Lawyer review of the legal pack recommended before M7 (DR-07) |
| Known issues | Lens minimums at the M3 re-score: developer 55 (D7 observability), designer 80 (P2), CRO 78 (C2); every axis below 90 has a named blocker (`docs/verification/scorecard/2026-11-14-m3-rescore.md`). Hotmart iframe `link-name` axe exclusion (#183) expires 2026-12-31. Interaction ceilings are provisional (warn until 2026-11-28). OpenSSF Scorecard repository findings (#7 branch protection, #10 code review, #11 maintained, #12 CII, #15 vulnerabilities) are settings signals, open. Live site still runs the pre-M3 build until M7 (OD-11) |

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
| M1-6 | `ci/m1-6-release-please`, `ci/m1-6-release-version-pr` | #167, #174 | done (version-bump PR and tagging workflow, ADR-0018; no token needed per OD-78) | 2026-11-14 |
| M1-7 | `chore/m1-7-skill-symlinks` | #163 | done | 2026-11-14 |
| M1-8 | `chore/m1-8-line-width-100` | #172 | done (Biome 2.6.7 in #170; 100-column reformat in `.git-blame-ignore-revs`) | 2026-11-14 |
| M1-9 | `chore/m1-9-ratchets` | #169 | done | 2026-11-14 |
| M2-1 | `ci/m2-1-lighthouse-lane` | #187 | done (production-config Lighthouse lane at error level, nightly live lane) | 2026-11-14 |
| M2-2 | `test/m2-2a-ratchet-phase`, `test/m2-2b-interaction-spec`, `test/m2-2c-interaction-suggest` | #198, #199, #200 | done (warn phase with fail-closed expiry and `calibrated` flag; frame, LoAF and INP specs plus reduced-motion lane in warn until 2026-11-28; calibration tool) | 2026-11-14 |
| M2-3 | `test/m2-3-mutation` | #189 | done (StrykerJS on node:test, ADR-0015) | 2026-11-14 |
| M2-4 | `test/m2-4-property-tests` | #175 | done | 2026-11-14 |
| M2-5 | `test/m2-5a-diff-coverage`, `test/m2-5b-webkit-iphone`, `test/m2-5c-visual-baselines`, `test/m2-5d-coverage-floor` | #203, #204, #205, #206 | done (diff coverage 85 %; iPhone 15 WebKit on 13 `@journey` tests in the PR set, Pixel 7 and iPhone nightly; region baselines at 0.01 in the digest-pinned image, repo 84.6 → 65.9 MB; unit coverage restored to lines 98.0, branches 89.4) | 2026-11-14 |
| M2-6 | `refactor/m2-6-design-tokens` | #194 | done (DTCG tokens, generated theme.css, ADR-0012) | 2026-11-14 |
| M2-7 | `test/m2-7-design-lint` | #181 | done | 2026-11-14 |
| M2-8 | `test/m2-8-content-tests` | #176 | done | 2026-11-14 |
| M2-9 | `feat/m2-9-scorecard` | #179 | done | 2026-11-14 |
| M2-10 | `test/m2-10-skill-evals` | #180 | done | 2026-11-14 |
| M2-11 | `feat/m2-11-state-gallery` | #178 | done | 2026-11-14 |
| M3-C1..C3 | `feat/m3-c-consent-opt-in` | #192 | done (ADR-0011 prior opt-in, consent v3, three equal buttons, lazy banner chunk after first paint, pixel only after a stored grant and idle, relay drops ungranted events) | 2026-11-14 |
| M3-C4 | `fix/m3-c4-legal-opt-in` | #208 | done (cookie and privacy pages state prior opt-in consent and withdrawal; the opt-out wording that #192 left behind is banned by a content test; Hotmart widget documented as strictly necessary) | 2026-11-14 |
| M3-C5 | `perf/m3-c5-lighthouse-ratchet` | #201 | done (home LCP 0.81-1.13 → 0.29 s, third-party JS before consent 100.5 → 0 KB; lab ratchet tightened; `docs/verification/perf/2026-11-14-m3-c5-consent-before-after.md`) | 2026-11-14 |
| M3-1 | `docs/m3-1-perf-trace` | #191 | done | 2026-11-14 |
| M3-2 | `perf/m3-2-mobile-starfield` | #196 | done (ADR-0017; product page lab TBT 0.00 s, LCP 0.92 s; first-party JS 356 → 181 KB) | 2026-11-14 |
| M3-3 | `perf/m3-3-js-budget` | #197 | done (embla removed, CSS scroll-snap gallery, lazy zoom; product pages 167.6 KB gz) | 2026-11-14 |
| M3-4 | `fix/m3-4-imprime-axe` | #188 | done (frame title; `link-name` inside the Hotmart iframe excluded with issue #183, expiry 2026-12-31) | 2026-11-14 |
| M3-5 | `feat/m3-5-edge-headers` | #190 | done (enforced CSP, ADR-0014, rollback switch; HSTS staged; one-year HSTS waits on PV-D9) | 2026-11-14 |
| M3-6 | `feat/m3-6-seo-hygiene` | #184 | done | 2026-11-14 |
| M3-7 | `feat/m3-7-accessibility-statement` | #193 | done | 2026-11-14 |
| M3-8 | `feat/m3-8-withdrawal-process` | #185 | done | 2026-11-14 |
| M3-9 | `docs/m3-9-readme-adr-refresh` | #186 | done | 2026-11-14 |
| M3-10 | `docs/m3-progress-rescore` | this PR | done (independent re-score; see the scorecard snapshot) | 2026-11-14 |
| M3 extra | `fix/m3-codeql-alerts`, `feat/m3-hub-lead` | #202, #207 | done (CodeQL code alerts fixed; audit F-05 concrete hub lead from approved copy) | 2026-11-14 |

## Scorecard snapshot (planner baseline 2026-11-09; M3 independent re-score 2026-11-14)

| Lens | Axis scores | Minimum |
|---|---|---|
| Developer | D1 88, D2 84, D3 70, D4 72, D5 62, D6 52, D7 55, D8 66 | 52 (D6) |
| Designer | P1 86, P2 80, P3 82, P4 90, P5 85, P6 90 | 80 (P2) |
| CRO | C1 74, C2 68, C3 80, C4 35, C5 90, C6 72, C7 30 | 30 (C7) |
| Developer, M3 re-score | D1 88, D2 80, D3 78, D4 84, D5 84, D6 92, D7 55, D8 82 | 55 (D7) |
| Designer, M3 re-score | P1 90, P2 80, P3 82, P4 82, P5 85, P6 88 | 80 (P2) |
| CRO, M3 re-score | C1 82, C2 78, C3 88, C4 90, C5 90, C6 85, C7 88 | 78 (C2) |

The M3 rows are independent evaluator scores of `develop` `f3704dc`; blockers per axis and the lead's factual notes (merges after scoring: #202-#208) are in `docs/verification/scorecard/2026-11-14-m3-rescore.md`.

Measured inputs: unit 277/277, coverage L 96.19 / B 88.11 / F 92.78, knip clean, build 61 s, Lighthouse mobile home 55 (LCP 4.4 s, TBT 2.1 s), kit page 31 (LCP 10.1 s, TBT 6.6 s), upsell 49, axe 2 serious on `/imprime-y-juega/`, Meta Pixel 209 KB and 2.1 s at first paint, HSTS 300, `/_next/static` 4 h cache, home JS headroom 0.2 KB gz.

## Ecosystem status (nine repositories; identical table in every repo)

| Repo | Plan | Milestone | Branch and SHA at planning (`git rev-parse origin/<branch>` after `git fetch -q`, 2026-11-09) | Notes |
|---|---|---|---|---|
| portfolio | v2 written | M0 | `develop` `0a1ff564f66475a1d9a360a9c927ac804accbf83` | bilingual site; hero particle system v2 |
| portfolio-assistant-api | v2 written | M0 | `develop` `e749ca762fb3f1e74225d9126d4eb1bbd88e2885` | RAG assistant API; eval and typing debt |
| portfolio-backoffice | v2 written | M0 | `develop` `e356b13d81d509e640b3b318c0d37c7b4abcce1c` | assistant and site analytics ops |
| pequeverso (this repo) | v2 written | M3 (tasks merged 2026-11-14) | `develop` `cbf519ce9c49f35a2536d4606520221a4a6debe0` | Spanish-only store; consent opt-in ships at M7 |
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
| M2 | 2026-11-14 | `6b6b682` | baseline | M2-1..M2-11 merged (#175-#206); mutation, property, diff coverage, iPhone WebKit, region baselines, DTCG tokens, design lint, scorecard, skill evals, state gallery | M3 | interaction ceilings provisional until 2026-11-28 | none |
| M3 | 2026-11-14 | `6b6b682` | M3 re-score above | consent prior opt-in, CSP enforced, scene gate, JS budget, withdrawal process, SEO, accessibility statement, README/ADR refresh, CodeQL fixes, concrete hub lead (#184-#208) | M4 after `checkpoint/M3` | lens minimums 55/80/78 with named blockers; live site unchanged until M7 | PV-D10, PV-D11, PV-D9; domain support mailbox; PV-D6 |
