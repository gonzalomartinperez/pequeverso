# Roadmap

Milestones M0-M7 and MV from ecosystem section 3A, plus M8 (profile showcase). There is no production hotfix track and none is planned: nothing reaches `main` before M7 (OD-11, DR-01); the consent fix is scheduled early in M3 on `develop`. Effort: S (at most 3 agent-hours), M (3-10), L (10-25); totals are agent hours with parallel worktrees, wall-clock is shorter (agents work in parallel continuously; the owner touches only the decisions list, the weekly dependency PR, milestone summaries and releases). Every task is a short-lived branch `<type>/<milestone>-<slug>` to `develop` with a green `ci-gate`, merged only with `gh pr checks --watch && gh pr merge`; merges are merge commits, never squash. Mapping to phases: Phase A polish = M1-M3, Phase B architecture and TypeScript = M4, Phase C end state = M5-M6, Phase V = MV.

Dependency on other repos: none blocks M1-M6 (the store consumes pinned contract snapshots). M7 order is APIs, backoffices, sites, vps-ops pins; this repo is Hostinger-hosted and not VPS-bound, so MV-R does not apply to it; the site releases third. MV needs the VPS and the assistant API.

## M0 - Plans merged

| # | Task | Acceptance | Effort | Status |
|---|---|---|---|---|
| M0-1 | Docs-only PR: this folder to `docs/master-plan/` on `develop` | `docs` profile green; README, RESUME, progress present; links resolve | S (1 h) | todo |
| M0-2 | Record the PV-D1..PV-D12 resolutions (delegated 2026-11-09, README section 7) in `progress.md`; list the three owner inputs (PV-D10, PV-D11, PV-D9) identically in README, RESUME and `progress.md` | no open item blocks M1; the three owner inputs are tracked, none blocks M1 | S (1 h) | todo |
| M0-3 | Tag `checkpoint/M0` | tag pushed | S | todo |

## M1 - Foundation (40 agent hours: M1-1 10, M1-2 4, M1-3 5, M1-4 3, M1-5 4, M1-6 4, M1-7 2, M1-8 2, M1-9 4, M1-10 2; M1-10 runs first, then M1-1 starts the sequential spine, the rest in parallel)

| # | Task | Acceptance criteria | Effort | Status |
|---|---|---|---|---|
| M1-1 | Adopt `engineering-standards` reusable workflows (when the repo exists, E1) or in-repo equivalents; `classify` job and `ci-profile.json`; `ci-gate` required (alias `ci` kept one week) | profile coverage test passes; docs-only PR p50 at most 2 min; gate fails closed (negative test) | L (10 h) | todo |
| M1-2 | Dependabot single weekly group; merge or close #148-#150; update `dependabot-manual.test.ts`; `deps-weekly-guard` | exactly one Dependabot PR observed on the next Monday (or simulated in the sandbox, E2); guard test | M (4 h) | todo |
| M1-3 | Supply chain: CodeQL default setup, Scorecard weekly, dependency-review, osv-scanner daily (issue not PR), CycloneDX SBOM artifact, repo setting "require SHA pinning", secret scanning and push protection | each workflow green; SBOM attached to a CI run; zizmor clean | M (5 h) | todo |
| M1-4 | Community files (SECURITY.md already handled in M1-10); `security.txt`; issue forms; PR template; `SUPPORT.md`; `CODE_OF_CONDUCT.md`; CODEOWNERS extension | files present; README heading and links check green | S (3 h) | in-progress |
| M1-10 | OD-53 / DR-14 repo-docs sweep, scheduled first in M1 (before M1-1) so it lands well before the domain expires on 2026-11-25. The live site and Hotmart already use only pequeverso.com (verified 2026-11-09), so this touches `develop` only (GitHub's default branch): fix `SECURITY.md` (replace the `digitalproductsteam.com` mailbox with the pequeverso.com contact), then remove every other reference in the repo docs; delete `docs/migration/old-domain.htaccess` (history stays in git; `file-moves.md` updated); add a content test (for example `tests/content/old-domain.test.ts`) that fails on any remaining `digitalproductsteam.com`; no redirects, no hotfix | `grep -ri digitalproductsteam` returns nothing outside `docs/master-plan/`, the old-domain content test and its negative fixture (the allowlist); the content test is green with a negative fixture; `SECURITY.md` on `develop` shows the new contact; interim state recorded in `progress.md` | S (2 h) | todo |
| M1-5 | ADR-0010 (standalone production target) and AGENTS.md header fix; inverted parity (standalone primary build in CI, export nightly) | `hosting` job still green; AGENTS.md no longer says "static export" is production | M (4 h) | in-progress (ADR-0010 and docs; CI inversion lands with M1-1) |
| M1-6 | release-please manifest on `develop` (sandbox-validated, E5), immutable releases setting, `v*` tag ruleset | release PR opens in the sandbox; first real release PR deferred to M7 | M (4 h) | todo |
| M1-7 | `.claude/skills` converted to symlinks; `check-skills.ts` updated; `.codex/config.toml`, `.worktreeinclude` | `npm run check:skills` green | S (2 h) | in-progress |
| M1-8 | Biome schema alignment and the 100-column formatting PR (single mechanical commit, `.git-blame-ignore-revs`) | `biome ci` clean; diff only whitespace per a script check | S (2 h) | todo |
| M1-9 | `ratchets/` created with current baselines (coverage 88.11, bundle, Lighthouse live, a11y 2 serious, repo size, complexity first run) | files committed; scorecard tool skeleton reads them | M (4 h) | todo |

Dependencies: M1-10 none; M1-2..M1-9 need M1-1 (CI profile) except M1-4, M1-7, M1-8 which are independent; M1-9 needs M1-1 and M1-8. Exit (safe point): `develop` green on the `release` profile; one weekly PR rule observed; SBOM and CodeQL live; `checkpoint/M1`. Risks: shared workflows repo not ready (use in-repo copies, migrate later); Dependabot group behaviour unverified (guard fallback).

## M2 - Quality net (64 agent hours: 6+6+6+5+6+10+5+5+6+6+3)

| # | Task | Acceptance criteria | Effort | Status |
|---|---|---|---|---|
| M2-1 | Production-config Lighthouse lane (fake pixel id, real third-party hosts) and nightly live lane; assertion levels from `warn` to `error` for the gates in `testing.md` | PR fails when LCP, TBT or JS KB exceed the ratchet (expected red at first: ratchet starts at today's values and tightens in M3) | M (6 h) | todo |
| M2-2 | Frame-time, LoAF and INP specs ([13] 2.7) including the reduced-motion lane | specs run in CI smoke lane; thresholds recorded as ratchets in warn for 14 days then enforce | M (6 h) | todo |
| M2-3 | Spike E7: Stryker `tap-runner` on `node:test` with TS 7; ADR-0015; scoped modules configured | incremental PR run at most 5 min; weekly full run at most 30 min; baseline score recorded | M (6 h) | todo |
| M2-4 | fast-check suites (checkout URL, formatUsd, consent cookie, slug and trailing slash, edge rules, sitemap, syllable game) | 100 runs PR, 1000 nightly; found issues fixed | M (5 h) | todo |
| M2-5 | Diff coverage script and coverage ratchet; WebKit iPhone project in the PR set; Pixel profile nightly; `maxDiffPixelRatio` 0.01 and region screenshots; baselines regenerated in the pinned image | diff coverage gate at 85%; repo-size ratchet does not grow; iPhone WebKit green on tagged journeys | M (6 h) | todo |
| M2-6 | Design tokens: DTCG JSON source, Style Dictionary build, generated `theme.css`, snapshot and contrast tests, `light-dark()` indirection with `color-scheme: light`; ADR-0012 | visual diff zero (pure refactor); contrast test reads the JSON | L (10 h) | todo |
| M2-7 | Design lint (coral, literals, `transition: all`, animated properties), guard additions with negative fixtures, `biome-ignore` issue rule | each rule has a failing fixture; baseline empty | M (5 h) | todo |
| M2-8 | Content tests: counters, urgency, voseo and regionalisms, tú, Spanish-only (no English store copy, OD-32), old-domain reference ban (OD-53), guarantee 7 days with email windows consistent with config (OD-50), price formatter; structured-data and metadata tests; header snapshot test; sitemap test | all green; negative fixtures included | M (5 h) | todo |
| M2-9 | Scorecard tooling (`tools/scorecard/`) producing `scorecard.json` nightly and failing on regression | nightly artifact exists; regression test fails on a seeded drop | M (6 h) | todo |
| M2-10 | Skills: catalog skeletons, `evals/` for each, harness profile | `check-skills` runs validation evals; gate configured | M (6 h) | todo |
| M2-11 | State gallery behind `NEXT_PUBLIC_DESIGN_GALLERY` and its absence check | route absent from publishable artifacts (check script) | S (3 h) | todo |

Dependencies: all of M2 needs M1-1 and M1-9 (ratchet files); M2-1 gates M3-2, M3-3 and M3-5 measurement; M2-8 needs M3-8 config keys only for the withdrawal assertions (stub until then). Exit: `scorecard.json` produced nightly; no gate in warn mode older than 14 days; `checkpoint/M2`. Risks: mutation tooling with TS 7 (fallback Vitest runner for scoped modules); baseline PNG churn (do the regeneration once).

## M3 - Phase A polish (56 agent hours: consent block C1-C5 12 h, M3-1..M3-10 44 h; plus owner inputs)

All P0 and P1 findings of `audit.md` closed with evidence; first independent re-score.

| # | Task | Acceptance criteria | Effort | Status |
|---|---|---|---|---|
| M3-C1 | Consent opt-in first (DR-01, PV-D1; scheduled before the other M3 tasks, on `develop`, no hotfix): ADR-0011 and `docs/tracking.md` updated to the opt-in policy | ADR merged; doc no longer says "opt-out" | S (1 h) | todo |
| M3-C2 | `DEFAULT_CHOICE` all false; `CONSENT_VERSION` 3; banner copy per playbook section 10, three equal buttons, renders after first paint | unit tests flipped (`tracking.test.ts` consent v3, default false); Playwright: first visit has no `fbevents.js` and no `facebook.com/tr` request on every route; Aceptar then loads it after idle | M (4 h) | todo |
| M3-C3 | Lazy gated load: pixel script only after stored grant and `requestIdleCallback`; CAPI relay drops events without grant | network assertion `third_party_requests_before_consent == 0` (new invariant) green; relay tests green | M (3 h) | todo |
| M3-C4 | Update `/cookies/` and `/privacidad/` copy and the cookie table (include Cloudflare beacon if it stays) | legal tests green; copy follows the delegated PV-D7 and PV-D8 resolutions | S (2 h) | todo |
| M3-C5 | Production-config Lighthouse run before and after, recorded | home LCP and TBT improve versus the `audit.md` baseline; numbers in `progress.md` | S (2 h) | todo |
| M3-1 | Trace the live and production-config product page (`performance_start_trace`); confirm causes of TBT and LCP (pixel versus scene versus framework); decision note in `progress.md` | hypotheses of F-02 confirmed or replaced | S (3 h) | todo |
| M3-2 | D-03: static starfield on phones; WebGL scene only on fine pointer at least 1024 px after first interaction; ADR-0017 | product page mobile TBT at most 200 ms and LCP at most 2.0 s on the production-config lane (4x CPU); scene chunks not requested on mobile profile | M (6 h) | todo |
| M3-3 | JS budget: CSS scroll-snap gallery (remove `embla-carousel-react`), lazy zoom dialog, drop unused Base UI parts, check client graph per route | product page first-load JS at most 170 KB gz; hub at most 165 KB; ratchet tightened | M (6 h) | todo |
| M3-4 | `/imprime-y-juega/` axe fixes: iframe title and link name, or documented axe exclusion with issue and expiry; skeleton and status states | 0 serious on every route and viewport | S (3 h) | todo |
| M3-5 | Edge: HSTS one year (after the one-week verification; the dashboard step is owner input PV-D9), `/_next/static` immutable verified through Cloudflare, Cloudflare beacon off or documented, CSP enforced policy (ADR-0014), header snapshot updated | `curl -I` evidence in `docs/verification/edge/`; production-daily header matrix green | M (5 h) | todo |
| M3-6 | SEO hygiene: `jsonLd()` serializer with `<` escape, `Organization`, `WebSite`, `Product`/`Offer` per spec, sitemap `lastModified` from content dates, metadata test | structured-data tests green; Rich Results Test screenshot (an agent run in the isolated browser; the owner is not needed) | M (5 h) | todo |
| M3-7 | Accessibility statement page `/accesibilidad/` (WCAG 2.2 AA target; EAA microenterprise note after counsel); privacy and cookies copy final incl. GDPR items and the art. 27 question (PV-D8 subset); seller identification stays off the footer (EX-PV-06) and appears only where law or Hotmart requires it: no footer-identification task exists or is planned | page live in `develop`; legal tests green | S (3 h) | todo |
| M3-8 | **Withdrawal-by-email process (PV-D2).** (a) Single-source in `config/commerce.ts`: `guaranteeDays` 7 plus `withdrawalWindows` per country (ES/EU 14, AR 10, CL 10, others from `consumer-rights.ts`), `supportEmail`, response time, 24 h code format, and the copy placeholders `paperFormat`, `practiceMinutes`, `currencyNote`, `hotmartConsumerUrl` used by `design-playbook.md` section 10; (b) es-419 text on `/soporte/`, `/compras-y-reembolsos/` and `/arrepentimiento/`: right of withdrawal by country, how to request it by email (what to write, order or HP code), time to answer, manual refund outside Hotmart's automatic window; (c) a reply template for the support inbox in `docs/how-to/answer-withdrawal-requests.md` (es-419, signed Equipo de Pequeverso, with the Argentine request code); (d) a content test: no copy may state a guarantee or withdrawal period that is not derived from config (7 days automatic, windows per country by email) and the legal pages must list every window in config | invariants test green; every page that mentions a period is generated from config; template follows the delegated PV-D7 resolution; no Hotmart change needed | M (4 h) | todo |
| M3-9 | README to template, docs reorganization plan started (moves in `file-moves.md` phase 1), ADR refresh (stale paths), CHANGELOG via release-please | README heading check green; ADR index check green | M (6 h) | todo |
| M3-10 | First independent evaluator re-score on all three lenses | every axis at least 90 or the stated blocker; scores in `progress.md` | S (3 h) | todo |

Dependencies and risks: M3-C1..C5 go first and need only M1-1; M3-2 and M3-3 need M2-1 for before/after numbers; M3-8 feeds the M2-8 content test; risk: the consent change lowers site event volume (accepted, README PV-D1). Exit: P0/P1 closed with evidence; consent opt-in merged on `develop` (reaches production at M7); re-score recorded; `checkpoint/M3`. Owner inputs (the same three as README section 7): PV-D10 phone check, PV-D11 family consent for proof, PV-D9 dashboard steps; the other items are resolved by delegation (DR-06, DR-07).

## M4 - Architecture and TypeScript (35 agent hours: 10+10+6+6+3)

| # | Task | Acceptance | Effort | Status |
|---|---|---|---|---|
| M4-1 | Extract `src/features/consent/` (domain, adapters, presentation) from `tracking` and `site-analytics`; ADR-0016 | architecture test: no dependency from consent to tracking; behaviour tests unchanged | L (10 h) | todo |
| M4-2 | Retire the static export path (PV-D3, resolved): remove `tools/serve-static.ts`, `gen-htaccess.ts`, htaccess artifacts, `deploy` branch publishing, `pageExtensions` trick; `route.standalone.ts` to `route.ts`; ADR-0010 finalised | CI green on standalone only; post-deploy verification unchanged | L (10 h) | todo |
| M4-3 | Complexity ratchet at baseline then reduce hot spots; guard rules with empty baseline; `noImportCycles` on | ratchets only fall | M (6 h) | todo |
| M4-4 | Docs to Diátaxis (moves), generated reference docs, how-tos; archive `docs/verification` evidence older than the last milestone to a release asset with hashes | docs checks green; repo size ratchet falls | M (6 h) | todo |
| M4-5 | Remove `cross-env`; dependency report script; `@lhci/cli` replacement if the spike succeeded | `npm run check` unchanged in behaviour | S (3 h) | todo |

Dependencies and risks: M4-1 needs M3-C2/C3; M4-2 needs M1-5; risk: `route.ts` rename breaks the export parity job (retire it in the same PR). Exit: guards enforce with empty baseline; 0 type errors; every `.js/.mjs/.cjs` justified (only `next.config.mjs`); `checkpoint/M4`. PV-D3 is resolved (standalone only, DR-08), so M4-2 is a full retirement.

## M5 - Master design (88 agent hours: 12+20+8+8+8+5+3+12+6+6; two repos at most in heavy design at once)

| # | Task | Acceptance | Effort | Status |
|---|---|---|---|---|
| M5-1 | Tokens: ramps, sunrise, paper, shadows; coral-press; sticker variant; `loading` and `aria-disabled`; all button states (playbook 3.1) | state gallery visual baselines; contrast test; axe per state | L (12 h) | todo |
| M5-2 | Kit page rebuild to the 11-block order: hero and buy box facts, trust strip, guarantee block, walkthrough, promoted playground, FAQ six; legacy CSS Modules removed on the route | per-view acceptance of playbook 5; legacy modules gone except assistant | L (20 h) | todo |
| M5-3 | Hub: concrete lead, doors in the first viewport at 320 x 568 and 390 x 844, banner placement, trust strip | C1 test passes; LCP at most 2.0 s | M (8 h) | todo |
| M5-4 | Sunrise transition and signature shapes; paper-cut planets and sheet frames; reduced-motion and Save-Data variants | frame-time gates green; static fallback verified | M (8 h) | todo |
| M5-5 | Micro-interactions: CTA loading and error states, sticky bar rules, route `<ViewTransition>`, prefetch on intent, age selector announcements | INP at most 150 ms on the five interactions; view transition at most 400 ms | M (8 h) | todo |
| M5-6 | Sample sheet (PV-D6): `features/sample`, asset through `tools/media`, no-capture download | download works offline-safe; no data collected; axe clean | M (5 h) | todo |
| M5-7 | Proof slot (only if PV-D11 produced assets) and "lanzamiento" line decision; thanks page and 404 | content invariants green | S (3 h) | todo |
| M5-8 | Content cluster (4-6 pages) and sitemap growth, owner-approved copy | pages indexable, schema valid, no claims | L (12 h) | todo |
| M5-9 | CSP hash spike (ADR-0014 outcome) | per-route hashes enforced, or compensating control recorded | M (6 h) | todo |
| M5-10 | Instagram in-app and real-device Safari run (human step); designer evaluator pass in screenshots 320/390/768/1280/1440 | designer rubric at least 95 or documented gap list | M (6 h) | todo |

Dependencies and risks: M5 needs M2-6 and M2-5 (tokens and visual baselines) and M3-2/M3-3 (budgets); M5-7's proof slot is built only if PV-D11 produced real consented assets (never shipped empty). Exit: visual baselines approved; designer and CRO evaluators at least 95 or a gap list; fluidity and performance gates green; `checkpoint/M5`.

## M6 - Excellence verified (25 agent hours: 5+5+3+2+3+1+6)

Dependencies: needs M5 exit. Risk: a lens below 95 after M5 (then M6-1 grows; the floor 90 needs a documented blocker). Exit: every axis at least 95 (or the floor 90 with the documented blocker) on two consecutive nightly scorecards; `checkpoint/M6`.

| # | Task | Acceptance criteria | Effort | Status |
|---|---|---|---|---|
| M6-1 | Close the remaining gaps from the M5 gap lists and the independent re-score | each gap closed with evidence or recorded as a blocker in `progress.md` | M (5 h) | todo |
| M6-2 | Mutation thresholds at target (weekly 75-80, break 60) on the scoped modules | weekly full run meets target; break threshold enforced in CI | M (5 h) | todo |
| M6-3 | Skills finalized and eval-gated | `npm run check:skills` green with all evals | S (3 h) | todo |
| M6-4 | Docs finalized (README to template, Diátaxis index, ADR index) | docs checks green; no stale path | S (2 h) | todo |
| M6-5 | Independent three-lens re-score | every axis at least 95 (or floor 90 with blocker); two consecutive nightly scorecards | S (3 h) | todo |
| M6-6 | Rehearse the rollback (revert PR) once on `develop` | revert PR merged green and re-applied; steps recorded in `docs/how-to/` | S (1 h) | todo |
| M6-C | OD-09 copy refresh before release: store, legal and support pages, README and repo description refreshed to the final state (verified facts from config only; no testimonials or invented numbers; no old-domain reference; Spanish es-419, tú, signed "Equipo de Pequeverso") | content invariants green; owner sees a summary, not a review | M (6 h) | todo |

## M7 - Release to `main` (M, 4 h plus verification)

One `develop` to `main` release PR (release-please PR merged first), merge commit, `release` profile green. Order across repos: APIs, backoffices, sites, vps-ops pins. After merge: Hostinger builds; `post-deploy-verify` waits for the merge SHA; live Lighthouse and header matrix; PV-D10 screenshots on the new build; tag `vX.Y.Z` and immutable release with SBOM; owner submits the sitemap in Search Console. Exit: `main` equals the released `develop`; CHANGELOG and tag published.

## M8 - Profile showcase (after all nine repos reach M7)

Contribute the Pequeverso entry to the GitHub profile redesign (OD-08): featured-project card, social preview, topics and description from verified facts, linking `pequeverso.com`; the profile README itself is owned by `gonzalomartinperez/gonzalomartinperez`. Exit: repo description, topics and social preview match the final state; `checkpoint/M8`.

## MV - VPS activation (gated by owner authorization and spend)

| # | Task | Acceptance | Status |
|---|---|---|---|
| MV-1 | RUM `web-vital` schema handoff to the API repo, `web-vitals/attribution` lazy client, dashboard in the backoffice | field p75 LCP, INP, CLS per route visible | todo |
| MV-2 | Enable in-house section analytics against the live API (explicit grant only) | `check:site-analytics-disabled` replaced by an enabled-build check; consent gate tests green | todo |
| MV-3 | Assistant activation per `cro.md` section 7 and `docs/assistant-activation.md` | API golden set 100% live, disclosure and handoff, holdout 10-20%, privacy text published, owner authorization recorded | todo |
| MV-4 | Hotmart webhook to CAPI Purchase (PV-D5), only with a consent record | Events Manager shows deduplicated server Purchase; legal sign-off | todo |
| MV-5 | Uptime Kuma probes and error tracking for the relay | alerts routed; synthetic journeys green | todo |

## Totals and critical path

Milestone headers equal their item sums: M1 40, M2 64, M3 56, M4 35, M5 88, M6 25 = 308 agent hours for M1-M6 (M7 4 h plus verification; M8 and MV excluded). The assistant widget tracks below add 26 h (M2-W 6, M2-X 2, M5-W 12, M5-X 6) on top, so 334 h with them; they are gated and do not block the main path. Wall-clock is shorter: after M1, three lanes run in parallel (static quality, CRO and legal, design).

Critical path: M1-10 (first) -> M1-1 (CI profiles and `ci-gate`) -> M2-1 (production-config Lighthouse lane) and M2-5/M2-6 (baselines, tokens) -> M3-C1..C5 and M3-2/M3-3 (consent, perf) -> M3-10 (re-score) -> M4-1/M4-2 -> M5-1 -> M5-2 -> M5-10 -> M6-5 -> M7.

## Task status, IDs and RESUME command

Every task ID above is stable (never renumber; add new IDs at the end of a milestone). Status values: `todo`, `in-progress`, `done (PR #N, SHA abc1234)`. The Status column is updated in the same PR that completes the task, and `progress.md` section "In-flight tasks" is updated on each task merge.

RESUME (find the true next task mid-milestone, no chat needed):

```bash
M=M3   # current milestone prefix from progress.md
git log --oneline --grep "$M-"                                  # merged work
gh pr list --state all --search "$M- in:title" --json number,title,state
grep -n "^| $M-.*| todo |" docs/master-plan/roadmap.md | head -1  # first todo row = next task
```

If a PR is open for a row still marked `todo`, treat that row as `in-progress` and continue that PR.

## Assistant widget tasks (see [assistant-widget.md](assistant-widget.md))

| # | Task | Acceptance | Effort | Status |
|---|---|---|---|---|
| M2-W | Test scaffolding for the widget: SSE fixture server with pacing helpers, state-gallery route stub, state x viewport snapshot matrix, axe runner, panel-chunk and INP gates in warn mode, red tests for the price-spoof, CTA, collision with buy bar and privacy rules | Tests exist and fail for the right reasons before the build; `assistant-disabled` spec stays green | M (6 h) | todo |
| M5-W | Widget design build (enabled build only; disabled build keeps zero trace): launcher pill, panel, streaming UX, product cards with validated prices, tokens, three signature details, analytics port (no-op until PV-D4 and the contract) | Section 12 acceptance list of the spec; panel chunk <= 60 KB gz; axe 0 serious or critical; activation still gated by PV-D12 | L (12 h) | todo |

## Assistant experience v2 widget tasks (see [assistant-experience.md](assistant-experience.md))

| # | Task | Acceptance | Effort | Status |
|---|---|---|---|---|
| M2-X | Block fixtures (product card with null price, unknown type, official-help source) in the SSE fixture server; red tests for price-spoof and fail-closed rendering | Tests fail for the right reasons | S (2 h) | todo |
| M5-X | Render typed blocks per widget section 14: product and resource cards from validated fields, citations with local icons, fundamentos, follow-ups, notices; memory UI hidden until the API flag and legal review | axe 0 serious or critical; no third-party requests; price only from validated fields | M (6 h) | todo |
