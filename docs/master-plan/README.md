# Pequeverso master plan v2

Status: planning only, dated 2026-11-09. Nothing in this folder authorizes code, deploy, spend or production changes; the owner decides each phase. This folder becomes `docs/master-plan/` in `gonzalomartinperez/pequeverso` through a docs-only PR to `develop` (milestone M0). There is no v1 plan for this repository.

Baseline: `origin/develop` `cbf519c` (2026-10-19). Live build measured on 2026-11-09: `cf61f20`. Production is `main` built by Hostinger on every merge.

## 1. Purpose

Turn `pequeverso.com` (printable phonics kit "Grafismo Fonético", an affiliate baby-food course, Hotmart checkout, a dormant shopping assistant) into the best conversion-first, kid-safe, privacy-respecting store site it can be, and keep it that way automatically.

Three lenses, scored independently against `rubrics.md`:

1. Senior developer (D1-D8).
2. Senior product designer (P1-P6).
3. Senior e-commerce/CRO (C1-C7, defined in `cro.md` section 9 from the rubric's lens 3 list).

The headline: the code base is already strong (strict TypeScript 7, architecture guard with negative fixtures, fail-closed CI, 277/277 unit tests), but **the live site performs far below what its own docs claim and collects marketing data before consent**. Those two facts drive the early milestones: the consent fix is scheduled early in M3 on `develop` and reaches production at M7 with the refactor (DR-01, no hotfix).

## 2. Owner requirements applied here

Verbatim list: `ecosystem.md` section 2.1 (requirements 1-12, binding). Repo-specific:

| # | Requirement | Where it lands |
|---|---|---|
| R1 | Pequeverso prioritizes conversion (UI/UX master, designer quality, fluidity, strict budgets) | `design-playbook.md`, `cro.md` |
| R2 | Keep the warm child identity anchored on navy; polish and elevate, not a tech palette | `design-playbook.md` sections 2-4 |
| R3 | Creative freedom to be unique; blues are a starting preference, not a constraint | `design-playbook.md` (paper-cut night sky concept) |
| R4 | Dark mode: no for now; build dark-ready tokens | `design-playbook.md` section 9, ADR-0006 stays |
| R5 | Assistant entry point disabled until activation; no trace in DOM or layout | `design-playbook.md` section 8, `cro.md` section 7 |
| R6 | Public copy: neutral Latin American Spanish with tú, signed "Equipo de Pequeverso"; never invent testimonials or facts; commercial facts only from config | `design-playbook.md` section 10, `cro.md` section 2 |
| R7 | Bio keeps one link, no parameters (invariant 6) | `cro.md` section 6 |
| R8 | All refactor lands on `develop`; `main` changes only at M7 (OD-11, DR-01: no hotfix before M7, the owner accepts the interim legal risk) | `roadmap.md` (consent tasks early in M3) |
| R9 | pequeverso.com publishes on merge to `main` (Hostinger, standalone); verify `build-info.json` | `target-state.md` section 1, `ci-cd.md` |
| R10 | Owner fact (2026-11-09): Pequeverso sells only to a Spanish-speaking audience (Latin America and possibly Spain). All store copy and the assistant entry are Spanish (es-419 neutral, tú); SEO targets Spanish queries with a single `es` locale; legal coverage includes Spain and the EU besides Argentina, Mexico and Chile; prices through Hotmart in the buyer's currency | `cro.md` sections 3, 5, 8; `design-playbook.md` section 10 |

## 3. Method

1. Read the owner understanding (`owner-decisions.md`), the ecosystem standard and rubrics, the repo at `origin/develop` (AGENTS.md, ADR-0001..0009, docs, CI, config, all 906 tracked paths) and the measured audit (`audit.md`).
2. Compared every ecosystem standard row with the repo; wrote only justified deviations (section 6).
3. Used the research notes (copied under `research/`): 07 (CRO), 13 section 4 (Pequeverso design), 06 (design systems), 01, 04, 05, 08, 10, 11.
4. Numbers: measured values come from `audit.md`; values that are proposals are labelled "proposal" or "to verify". Colour values in the playbook were computed (OKLCH to sRGB, WCAG 2 contrast formula), not guessed.
5. Scores are the planner's provisional baseline against rubric criteria ("a criterion without evidence is unmet"); the independent evaluator re-scores at M3.

## 4. Decisions table

| ID | Decision | Why | Sources | Alternatives rejected |
|---|---|---|---|---|
| D-01 | Production target is the Hostinger Node.js Web App (standalone). Static export stays only as a CI parity build until M4, then is retired by ADR-0010 (DR-08, resolved) | Live evidence: `docs/deployment.md`, `config/next.ts` auto-detects `/hbuilds/`, CAPI route exists only in standalone; AGENTS.md and ADR-0001 still say "static export" | repo docs; ecosystem 9 ("verify deploy mode first") | Keep two first-class targets forever (double CI cost, `.htaccess` generator nobody serves); return to static + LiteSpeed (loses CAPI relay, needs hosting change) |
| D-02 | Marketing consent becomes opt-in, pixel and CAPI relay load only after an explicit grant (DR-01: scheduled early in M3 on `develop`, ships at M7 with the refactor, no hotfix) | Own doc `docs/tracking.md` says opt-out fails prior-consent rules; Chile Ley 21.719 from 2026-12-01; pixel is 209 KB and 2.1 s of main thread at first paint | `audit.md` F-01; [07] sections 9-10 | Keep opt-out (legal exposure, and it is the main cause of the LCP/TBT gap); drop Meta entirely (loses the only ad-optimization signal) |
| D-03 | Phones get the static SVG starfield; the WebGL scene mounts only on fine pointer, width at least 1024 px, after first interaction | Product page TBT 6.6 s and LCP 10.1 s on 4x CPU; scene chunks are 177.6 KB; parents browse in in-app browsers on mid Android | `audit.md` F-02; [13] sections 2.5-2.6 | Keep scene on all devices (fails budgets); remove scene (loses signature) |
| D-04 | Conversion page keeps the 11-block order of [13] 4.3, with a guarantee block before the offer and one honest sample; no fabricated proof | Single-price infoproduct; best levers are speed, honest page and Hotmart hand-off | [07] sections 1-4; [13] 4.3 | Testimonial carousels, counters, urgency (illegal or untrustworthy) |
| D-05 | Identity concept "Paper-cut night sky": navy night, cut-paper planets, a single sunrise transition to cream, coral only for purchase and price | Elevates the existing universe without a new palette; gives one memorable moment that is CSS-only | [`design-playbook.md`](design-playbook.md) | Neon or tech palette (off brand); mascot characters (kid-voice risk, [07]) |
| D-06 | Tokens move to DTCG JSON built into one generated `theme.css`; semantic tokens use `light-dark()`-ready indirection with `color-scheme: light` | Ecosystem 13; dark-ready without shipping dark | [06] s1; [13] 4.8 | Ship dark now (no conversion evidence; doubles QA on the page that sells) |
| D-07 | Cookieless counter plus consent-gated Meta; in-house opt-in section analytics stays default-off until the VPS exists (MV) | Honest traffic numbers without a banner dependency; the in-house channel needs the API | [07] section 9; `docs/site-analytics.md` | GA4 + Consent Mode (needs ads conversion modelling, undercounts, legal contested) |
| D-08 | FAQ stays on page as `<details>`; no `FAQPage` JSON-LD | Google limited FAQ rich results in 2023 and reportedly removed them in 2026 (unverified); zero ranking value | [07] section 7 | Add FAQPage markup (maintenance with no benefit) |
| D-09 | No `llms.txt`, no "AI schema" work | Google says no effect; adoption negligible | [07] section 7 | 30-minute file (optional later, no expected return) |
| D-10 | Test runner: one spike (roadmap M2-3) decides for all four TypeScript repos (DR-09): Vitest 4 preferred if StrykerJS works with TS 7, otherwise `node:test` with Stryker `tap-runner`; this repo does not pre-commit to either | Same choice everywhere; today 277 `node:test` tests run in 10 s, so no migration happens without a spike result | ecosystem 11.2, E7, DR-09 | Migrate to Vitest immediately; decide per repo |
| D-11 | Node stays 24 (Hostinger builder is Node 24 on GLIBC 2.28) | Fleet standard is 26 LTS, but the host decides the production runtime; record as a deviation | `docs/deployment.md`; ecosystem 8.1 | Move CI to 26 while production builds on 24 (tests the wrong runtime) |
| D-12 | CSP: enforce a strict-but-`unsafe-inline` policy in M3, move to per-route script hashes in M5 if the spike works | Next static pages emit inline scripts whose hashes differ per route; nonces need request-time rendering which this site forbids | [01] section 8; `docs/architecture.md` | Nonce CSP via proxy (breaks static rendering rules) |
| D-13 | No hotfix. The consent opt-in, lazy gated pixel and banner copy (DR-01, PV-D1) are built early in M3 on `develop` and reach production at M7 with everything else; the owner accepts the interim legal risk (Chile Ley 21.719 date 2026-12-01 falls before M7) | Owner decision 2026-11-09 (OD-11, DR-01) | `owner-decisions.md` | Owner-authorized hotfix before 2026-11-27 (rejected by the owner) |
| D-14 | Single Spanish locale (`lang="es"`, `og:locale es_LA`), no hreflang until a regional variant with different content, price or legal text exists; if Spain gets its own variant, add `es-ES` and `es-419` hreflang pairs plus `x-default` | Owner fact R10; one URL per page avoids duplicate-content risk; Google's international docs are the reference ([07] marks es-419 handling as uncertain) | [07] section 7 | Country subfolders now (no regional content to justify them) |

## 5. Deviations from the ecosystem standard (all justified)

| Standard | Deviation | Reason |
|---|---|---|
| Node 26 LTS | Node 24 until Hostinger offers 26 | Host builder (D-11) |
| Containers (section 8) | No application image; the `hosting` CI job uses a pinned Rocky 8 image only to emulate the host | Hostinger builds from source; nothing is deployed by digest. Provenance is replaced by the Hostinger compensating controls in ecosystem section 7 |
| Dependabot single group, cooldown 7/14/3 | Cooldown stays at the long values (7/14/3 or longer) | Hostinger sites ship straight to production (ecosystem 5.2) |
| Test runner | Decided by one spike for all four TypeScript repos (DR-09); `node:test` today | D-10 |
| Dark theme parity (P5) | Single light theme by ADR-0006 with evidence ([06] section 8, [13] 4.8); revisit trigger in playbook section 9 | Rubric P5 allows a single-theme repo with an ADR that cites evidence |
| Backoffice/API contracts | The store consumes `contracts/assistant-api` and `contracts/site-analytics` snapshots only | No runtime coupling; unchanged |

## 6. Limits of this plan

- Field data (CrUX/RUM) does not exist: the PageSpeed Insights calls returned HTTP 429 (`audit/psi/`), and traffic is low. CWV field targets are scored from lab until RUM exists (floor 90 stated in `scorecard.md`).
- Legal notes are research, not legal advice; Argentine, Mexican and Chilean items need counsel or the owner's accountant (`cro.md` section 8).
- Hotmart internals (payment methods per country, bump behaviour, native pixel consent) are not verifiable from the repo.
- The live pixel finding, the 4-hour static cache and the hub LCP numbers are measured; their causes are hypotheses until the M3 trace tasks run.
- Spain and EU items (GDPR art. 27 representative, European Accessibility Act scope for a one-person third-country seller, VAT display in Hotmart's euro checkout) come from general knowledge and the repo's own checklist, not from sources opened this session; counsel confirms them (PV-D8).
- Branch flow: EX-PV-16 (squash into `develop`) is superseded; every merge is a merge commit (ecosystem section 3, rulesets allow merge commits only).
- Declined nice-to-haves: a recorded fixture of the real third-party cost lane is not added to this plan (M2-1 captures it on its first run and stores it under `ratchets/`); test names are given only where a file already exists (`tracking.test.ts`, `tracking.spec.ts`), the rest are named by the implementing agent in its PR to avoid inventing paths.
- Phase V (VPS) items: assistant activation, in-house analytics collection, RUM ingestion.

## 7. Decisions PV-D (all delegated and resolved on 2026-11-09, except the owner inputs listed below)

The owner delegated every open decision to the planner (`owner-decisions.md`, Delegated resolutions): each is resolved as the recommendation below. Owner-only touchpoints remain as in `ecosystem.md` section 15.4.

| ID | Decision | Resolution | Status |
|---|---|---|---|
| **PV-D1** | Marketing consent model: switch from opt-out (decided 2026-09-14) to prior opt-in; consent-gated lazy pixel; CAPI relay only after grant | Resolved (delegated, 2026-11-09): **Opt-in.** Equal "Aceptar" and "Rechazar", no pixel before choice. NO hotfix (DR-01): built early in M3 on `develop`, ships at M7 with the refactor; the owner accepts the interim legal risk, including Chile's Ley 21.719 date (2026-12-01; a postponement bill passed first reading on 2026-10-28, unresolved). Spain and the EU strengthen the choice: GDPR and the ePrivacy rule (in Spain, LSSI art. 22.2 and the AEPD cookie criteria already cited in `docs/tracking.md`) require prior consent for marketing cookies. Expected cost: fewer site events; Hotmart's own checkout events stay complete | Resolved; DR-01, ships at M7 |
| PV-D2 | Document and publish the withdrawal-by-email process. Owner fact: Hotmart allows one global guarantee, set to 7 days (`guaranteeDays`). Longer legal windows (Spain/EU 14 days; Argentina and Chile 10 days) are honored manually: the buyer emails support and the owner refunds outside Hotmart's automatic window | Resolved (delegated, 2026-11-09): Not a defect to fix in Hotmart. Publish the process (support page text by country, how to request by email, reply template, 24 h code for Argentina), single-source the windows in `config/` and test that no copy promises anything inconsistent with the 7-day guarantee plus this process. The owner commits to answering within the legal times (EU 14 days, AR/CL 10 days) and to refunding manually (DR-06); pages, reply template and content tests ship in M3 | Resolved; DR-06 |
| PV-D3 | Production target: standalone only; retire the static export and `.htaccess` generator at M4 | Resolved (delegated, 2026-11-09): Retire. Keep export as nightly parity until M4. ADR-0001 is superseded by ADR-0010 (DR-08) | Resolved; DR-08 |
| PV-D4 | Cookieless traffic counter: Umami (CSP already allows `cloud.umami.is`; free-tier terms unverified) or Plausible (about USD 9 per month per [07], vendor figure) or none until the VPS | Resolved (delegated, 2026-11-09): Umami cookieless counter with consent-aware events; Hotmart native pixel for purchases; webhook to CAPI only at MV (DR-11) | Resolved; DR-11 |
| PV-D5 | Purchase measurement: keep Hotmart's native pixel for Purchase now; add a Hotmart webhook to CAPI relay only in MV with a consent record | Resolved (delegated, 2026-11-09): Keep Hotmart's native pixel for Purchase; webhook to CAPI only at MV with a consent record (DR-11) | Resolved; DR-11 |
| PV-D6 | Free sample: start with one or two real sample pages as direct download (no email, no data); email opt-in sample later | Resolved (delegated, 2026-11-09): No-capture first (zero personal data, no AAIP implications); email later with PV-D8 done | Resolved |
| PV-D7 | Approve the public copy package in `design-playbook.md` section 10 (hub lead, buy box microcopy, guarantee block, consent banner, FAQ set) | Resolved (delegated, 2026-11-09): Approve with edits; facts stay placeholders resolved from config | Resolved |
| PV-D8 | Legal pack with counsel or accountant: AAIP database registration, Data Fiscal, ARS price display, Chile, Mexico and Spain/EU withdrawal wording, EU-facing privacy (GDPR) and accessibility (European Accessibility Act) review, privacy-policy update for opt-in and assistant | Resolved (delegated, 2026-11-09): Implement the recommended texts (withdrawal button, privacy and cookies for AR/MX/CL/ES-EU, accessibility statement) as one batch in M3; seller identification stays out of the footer as the accountant advised (EX-PV-06, in force) and is shown only where law or Hotmart requires it, so no footer task exists; `progress.md` flags that a lawyer review is recommended before M7; agents never present legal text as legal advice (DR-07). `cro.md` section 8 lists each item | Resolved; DR-07 |
| PV-D9 | Edge settings: HSTS to one year with `includeSubDomains` after verification, turn off the Cloudflare Web Analytics beacon (or document it), fix the 4 h cache on `/_next/static` | Resolved (delegated, 2026-11-09): Yes to all three; HSTS has a rollback cost, so owner OK | Resolved; owner applies dashboard steps |
| PV-D10 | Verify the live Hotmart checkout on a phone in MX, CL, CO, PE, AR (price, currency, payment methods, any bump hiding OXXO/SPEI) | Delegated recommendation: Owner does it once on a phone and records a screenshot set (price, currency, payment methods, any bump hiding OXXO/SPEI); only the owner can verify the live checkout | Owner input |
| PV-D11 | Real proof program: written consent from families for photos or quotes after real delivery; named-author photo | Delegated recommendation: Owner starts collecting written family consent after delivery; the slot is built, shipped empty never. Personal commitment of the owner | Owner input |
| PV-D12 | Assistant activation (MV, not now): holdout 10-20%, launch checklist in `cro.md` section 7 | Resolved (delegated, 2026-11-09): Not before the eval gate and the VPS; decide at MV (owner authorizes activation in one step, DR-13) | Resolved; gated by MV |

Owner inputs still needed (3): (1) PV-D10, one-time phone check of the live Hotmart checkout in MX, CL, CO, PE and AR; (2) PV-D11, written consent from real families for photos or quotes after delivery; (3) PV-D9 dashboard steps (Cloudflare and Hostinger settings only the owner can change).

Closed by the owner or by this plan (not open): dark mode "no for now" (ADR-0006 stays); coral only for purchase; assistant disabled in publishable builds; bio keeps one link; old domain digitalproductsteam.com not renewed and not redirected (OD-53, DR-14): the live site and Hotmart already use only pequeverso.com; the remaining references are repo docs and `SECURITY.md` on `develop` (GitHub's default branch), removed early in M1 by task M1-10 with a guarding content test, no hotfix; no hotfixes before M7 (DR-01); Spanish-only audience (OD-32); guarantee 7 days with longer legal windows honored by email (OD-50).

## 8. Index of files

| File | Content |
|---|---|
| [`scorecard.md`](scorecard.md) | Baseline per axis per lens, targets, measurement, ratchets |
| [`rubrics.md`](rubrics.md) | Ecosystem rubrics v2 (byte-identical) plus repo notes |
| [`audit.md`](audit.md) | Measured baseline, findings P0/P1/P2, inventory |
| [`target-state.md`](target-state.md) | Architecture, build target clarification, guards, JS destinations, ADRs |
| `design-playbook.md` | Conversion-first design system and page, states, motion, copy proposals |
| [`assistant-widget.md`](assistant-widget.md) | Assistant widget: launcher, panel, streaming, accessibility, tokens, events, tests (shared standard, per-site identity) |
| [assistant-experience.md](assistant-experience.md) | Assistant experience v2: performance, grounding, rich blocks contract, web access policy, opt-in memory, harness, evals, rollout |
| [`cro.md`](cro.md) | CRO plan: value, trust, purchase path, speed, SEO, analytics, assistant, legal |
| [`testing.md`](testing.md) | Every row of the ecosystem test catalog mapped |
| [`ci-cd.md`](ci-cd.md) | CI profiles, `ci-profile.json` draft, budgets, supply chain, release |
| [`file-index.csv`](file-index.csv), [`file-moves.md`](file-moves.md) | Every tracked file and every move or deletion |
| [`standards.md`](standards.md) | Style choices and enforcement |
| [`docs-and-community.md`](docs-and-community.md) | README outline, community files, Diátaxis, C4 |
| [`skills.md`](skills.md) | Skill audit, catalog mapping, activation evals |
| [`dependencies.md`](dependencies.md) | Each dependency and decision |
| [`roadmap.md`](roadmap.md) | M0-M7 and MV checklists |
| [`progress.md`](progress.md), [`RESUME.md`](RESUME.md) | Milestone log, session-independent resume brief |
| [`ecosystem.md`](ecosystem.md), [`rubrics.md`](rubrics.md), [`readme-template.md`](readme-template.md) | Byte-identical standard copies |
| [`owner-decisions.md`](owner-decisions.md), [`owner-decisions-existing.md`](owner-decisions-existing.md) | Owner decisions register and pre-2026-11-09 decisions (byte-identical; binding) |
| [`research/`](research/) | Copies of cited research notes |
| [`audit/`](audit/) | Evidence copied from the measured audit |
| [`sources.md`](sources.md) | External sources with dates and commercial-interest flags |
