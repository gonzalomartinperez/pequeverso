# Native assistant verification (2026-10-10)

This dated report preserves the earlier bilingual implementation and its exact fixtures. It is
historical evidence; the current Spanish-only interface requires a separate exact-source
verification against the compatible API revision. Do not attribute these results or images to
the later compact refinement or Spanish-only profile.

## Compact Spanish refinement (2026-10-12, local evidence)

Runtime candidate `ec32eb1a3bbcd11eae49f20dfb6da670ddce4b5d` keeps the storefront identity,
opens a compact 408×560 px desktop region, fixes the interface to Spanish, uses the title
“Asistente de Pequeverso” without a visible IA badge or language selector, and requires API
v1 revision 1.4 for its immutable Spanish response policy. Legacy transport behavior and stored
answer languages remain compatible. The final producer pin is the reviewed, protected API
integration commit `b7dcb0c27d214cb1b560a8ee6101f858545646fc`; its 17 manifest artifacts are byte-identical
to the temporary `debb678559b59425503e70fec3e6d16ea173ae81` used for the local browser run below.

The initial compact trial's conditional reading gutter caused a real defect: at doubled text,
a long earlier user question rewrapped when the latest-answer control appeared and displaced
the answer out of the Chromium phone viewport. The original candidate `127a003` run is preserved:
36 cases, 18 passed, 14 conditional skips, 4 failed, 0 retries. The correction restores a stable
68 px reading gutter once messages exist, keeps the full-width greeting, and strengthens the
regression with actual scrollTop and paragraph-position checks. All prior control separation,
44 px target, visible-line, paint, keyboard and card/source wrapping assertions remain.

For `ec32eb1`, `npm run check` passed in 71.086 s (160 unit tests, disabled guard over 127 files,
14 rendered pages and existing budgets); skills passed in 0.332 s and the isolated enabled fixture
build in 59.800 s. A six-project, retries-0 affected run completed 60 cases: 51 passed, 7 conditional
skips and 2 Firefox deadline failures, in 1160.788 s test time / 1163.565 s process time. The long-text
200% regression passed in every project, including both 320/390 px phone widths. All 24 enlarged-text
short-header/clear-confirmation cases passed. The two failures remain recorded: streamed-answer
verification and the two-width mobile-controls case exhausted their existing 45 s limits. Their
root cause is not established; this is not a completely green local browser run. An earlier
interrupted attempt exited 143 before JSON reporting, with unknown case results; its raw files
and owned orphan-process cleanup receipt are preserved. Exact-head full CI is required before
integration; the isolated revalidation below does not relabel the original full run.

At final producer pin source `8865edd5ff9fe471f1eb335a195a33cbc8662898`, the unchanged two failing
Firefox cases passed once, retries 0, in 95.205 s test time / 97.739 s process time. Their 45 s case
limits, assertions and skips were not changed. `npm run check` passed in 127.335 s (160 unit tests,
14-page disabled export, guard 127 and budgets); skills passed in 0.995 s and the fixture build
in 77.839 s. All 16 public playground cases passed in 175.641 s test time / 179.398 s process time,
covering the real home and landing catalogs, keyboard/touch and reduced motion. The existing
200 % text checks passed home and landing at both 320/390 px in Chromium, Firefox and WebKit:
6 passed, 4 configuration skips, 0 retries, 110.244 s test time / 113.232 s process time.

The [DPR-2 photography gallery](assistant/2026-10-12/README.md) includes all six requested full-window
states plus legible details of waiting, real fixture SSE, sources, the full product card, retained
drafts and network errors. Every selected image was inspected at original detail by the implementing
agent. The image manifest keeps the exact build/runtime/API SHAs, dimensions and hashes. The original
external photography recipe discovered its two viewport cases twice through an archive inside its
test directory: 4 passed, 0 failed/flaky/retries, 108.567 s process time; this is recorded explicitly.
A portable documentation-only recipe is outside the normal CI test directory and retains the
unchanged behavioral gates.

Three separately authorized storefront corrections preserve facts, checkout, consent and tracking:
the local Includes counter aligns the actual “414” text range with its tile (offset 7.5/6.5/4.5 px
before, 0 px after at 1440/768/390); the existing desktop family portrait grows from 318×477 to
404×606 px with complete faces and GA·TO cards and the same image asset; and both published demo
word catalogs now mix ordered/reversed pairs through the shared deterministic shuffle. The old
home catalog's all-reversed negative control is retained. Tablet/mobile keep the decorative
portrait hidden. Before/after captures at all three widths were inspected by the implementing
agent; a separate agent also inspected the 1440 px counter/portrait pair. These checks are not
human review, physical-device certification or VPS capacity measurements.

The first exact-head PR CI at `88f2dab` ([38312209865](https://github.com/gonzalomartinperez/pequeverso/actions/runs/38312209865))
failed before native browsers: uv 0.12.21 could not locate the producer's Python 3.14.8, and the
history scanner matched a public Git SHA beside “API producer” in the gallery provenance.
Build, standalone parity, workflow lint, Lighthouse and both public E2E shards passed; the run
remains failed. The fixture consumer tool now matches the reviewed producer's uv 0.13.0.
Provenance wording is corrected, and only the exact old commit/path/rule/line fingerprint is
ignored; default secret rules, redaction and the nonzero-history gate remain active. A same-hash,
same-file finding in a new commit must still fail the negative control.

A real-model UI review separately found that three selected resources could be mistaken for the
kit inventory. Product badges now say “3 destacados”; lists/comparisons say “Materiales destacados”
and explain “Selección para esta respuesta”. The canonical nine-PDF product summary is unchanged.
The deterministic presentation regression uses three actual published resources through a pinned
SSE fixture at doubled text and both phone widths; it does not claim a model or persistence test.
The reviewed guarantee gallery has zero resources, so the changed subset labels do not render there.
The price date is also labelled “Referencia del catálogo del ….”: legacy `verified_at` is the
export reference date, not a live Hotmart confirmation. Prices, dates and tax/conversion notes
are unchanged; final payment totals remain Hotmart's responsibility. Render regressions forbid
the old “Precio confirmado” claim. Original gallery/CI receipts are retained; affected photographs
were recaptured uniformly at `3514aca`; implementing and independent agents inspected all 14
selected images at original detail. The original `8865edd` photography remains preserved.

For subset/source-scanner increment `0fa4d4dc78a3b8de9ab03431f91f5fb66a9054c3`, full check passed
173.552 s (160 unit tests, disabled export/guard127), skills0.915 s and fixture build79.612 s.
Six-project subset/preview verification passed8, skipped4 conditional preview projects, failed0,
flaky0, retries0,152.544 s process time. The portable photography passed exactly2 cases,77.138 s.
The final source's ordinary-clone history scan passed83 scanned commits. Re-adding the identical
public-SHA provenance in a different isolated audit commit still produced a finding and exit1;
an empty-history repository also failed. The first wording-only negative control returned0
because the hash line was not added in that Git diff; its insufficient result is preserved.
No audit commit was pushed, no history was rewritten, and no real key was read or printed.

A later independently committed integration change (`83dcd05`, PR88) added a broad exception for
any backticked 40-hex match inside `docs/verification/**`. A factorized isolated audit used the
same 90 commits, exact historical fingerprint and a new synthetic README line13: the original
configuration detected one generic-api-key finding (exit1,12.329 s), while the broad exception
hid it (exit0,8.078 s). Only known public Git hashes were used; no real credential was read.
The assistant branch reconciles protected develop through a normal merge, removes only that
broad exception and restores the original reviewed configuration bytes. The exact historical
fingerprint, generated-manifest whole-line exceptions, default rules, redaction100 and the
nonzero-history requirement remain intact. Corrected-head positive/new-commit negative/empty
history controls and exact-head CI are required before integration.

Catalog-date source `3514aca` passed full check (93.937 s), skills (0.470 s), and the
isolated enabled fixture build (73.984 s). Its 18-case affected run remains **13 passed,
4 conditional preview skips, 1 WebKit-mobile deadline, 0 flaky and 0 retries** (298.408 s test,
303.454 s process). The original trace passed the 320 px subset geometry, then exhausted the
shared 45 s deadline while reaching the 390 px visibility assertion. Neither a clipped-content
cause nor a successful second-width assertion is claimed.

The exact-source [CI 38316958678](https://github.com/gonzalomartinperez/pequeverso/actions/runs/38316958678)
failed the native gate: **170 passed, 47 conditional skips, 7 failed and 4 flaky**. All failures
and retries were in the new header geometry test. A separate actual-browser mutation/animation
probe established `ready` during the own 220 ms panel entrance: computed target 44 px, running
scale 0.990912, rendered width 43.600098 px. After the animation the transform was `none` and
width exactly 44 px. The test now waits only for finite animations owned by the panel before
measuring, preserving `>= 44`, every focus/geometry check and the existing deadlines/retries.
The negative 43.99 px control still fails. The two subset widths are separate 45 s cases with
identical assertions; the existing continuity case now also preserves draft/history across
320↔390 resizes and retains its one-session/one-message assertions.

A separate portable photography run at `3514aca` passed exactly two cases (78.862 s test,
85.322 s process), with zero failures/flaky/retries. All 14 selected DPR-2 PNGs now show the
current catalog-reference copy. Photography is not acceptance for the failed native gate.
The originals, both failed runs and diagnostic probe remain preserved. The later test-only
correction still requires affected browser revalidation and a completely green exact-head CI.

No provider calls, key reads, deployment or activation occurred in these storefront checks.
Enabled previews are local fixture artifacts; every publishable export must still pass the strict
disabled guard. The dated evidence below remains historical and is not relabelled as this candidate.

## Historical verification (2026-10-10)

Fixture-only verification on WSL2, Node 24.21.0. Store runtime source `b5acff88c5d3752d876f1dbb5d649807ba2a6f7d`, unchanged by test readiness source `00a121d164f734998c72afb657284f1b4d2f3640`; API producer `b27d35c9ce2f02e5519b4476001f01c7172d6eb2`, v1 revision 1.3, manifest `fa6df707bb05061a77a60d68fbf0c55a7593e815f1110531a9dbbfaac8f3f71e`.
No paid calls, no real key reads, no deployment. Enabled verification output is explicitly UNPUBLISHABLE and rejected by the publication guard.

## Results

| Check | Result |
|---|---|
| `npm run check` | Pass, 45.72 s; 156 unit tests, lint, types, knip, disabled export and budgets |
| `npm run check:assistant-disabled` | Pass, 127 files; build-info assistant=disabled; enabled fixture positive control rejected with exit 1 |
| `ASSISTANT_API_DIR=<clean API checkout at the producer SHA> npm run test:e2e:assistant` | 87 passed, 33 conditional skips, 0 failed or retries; 331.70 s test runtime, 355.82 s including isolated build |

Six projects: Chromium desktop, Chromium Pixel 7, Chromium reduced motion, Firefox desktop, WebKit desktop, WebKit iPhone 13. These are browser emulations, not physical-device certification.
The suite uses HTTPS loopback and fixture streams. It verifies streaming completion and subsequent submission, interruption/cancel/recovery, restore/reset, IME and focus, route/draft/history continuity, localized ES/EN states, request snapshots and revision-gated nested context. Enabled panel text at 200% is checked at 320 and 390 px in all three desktop engines, including horizontal bounds, focus reachability and a reduced 360 px viewport. Mobile response text is explicitly scrolled into view and asserted visible.

## Conditional skips (33)

| Condition | Skips |
|---|---:|
| Desktop keyboard case excludes two mobile projects | 2 |
| Desktop expand/restore case excludes two mobile projects | 2 |
| Phone geometry case excludes four desktop projects | 4 |
| Context wire/navigation case runs on Chromium desktop | 5 |
| ES/EN runtime/draft/history case runs on Chromium desktop | 5 |
| English-question fixture case runs on Chromium desktop | 5 |
| Enabled 200%/reduced-viewport case runs in the three desktop engines | 3 |
| axe case explicitly runs on Chromium and Firefox, excluding WebKit | 2 |
| Reduced-motion-only case excludes five other projects | 5 |

The inherited axe gate deliberately targets Chromium and Firefox. No harness incompatibility has been established. The six-project suite does not include an axe-on-WebKit gate; separate ad-hoc checks are documented below. WebKit has functional, keyboard/focus, geometry and inspected visual coverage. Automated axe results do not establish complete WCAG compliance.

## Reader position regression

The PR CI runs at `c869beb` and `5f9ead9` were aggregate green but each had one WebKit-mobile retry (86 passed, 1 flaky, 33 skips). These are historical diagnostics, not clean native acceptance. Investigation established a real ordering risk: a late ResizeObserver callback could pull a reader back to the bottom before the browser delivered an upward scroll event.

The deterministic regression establishes an actual upward scrollTop before invoking the captured native observer callback in the same task. Against the old `c869beb` artifact it fails: scrollTop moves 762→0 and the observer incorrectly restores 762. The corrected runtime synchronously records actual programmatic positions and checks reader movement before following a resize. The same regression retains the reader position, a visible paragraph and jump control, then proves that jump-to-latest restores following. The second historical CI retry's hypothesized asynchronous scrollIntoView cause was not reproduced or established; instrumented receipts and traces remain preserved. The final local collection above has zero retries, failures or new skips. New exact-head CI and nightly remain required; historical runs are not relabelled as clean.

## Automatic-follow precondition

Release CI [38038413638](https://github.com/gonzalomartinperez/pequeverso/actions/runs/38038413638) on `016f0a3` was aggregate green but retained one WebKit-mobile retry: 86 passed, 1 flaky, 33 skips. The failure was `Reader did not move upward: 0 → 0` before invoking the captured observer. Its screenshot, raw report and trace are preserved; it is not clean native acceptance. The failed screenshot shows the transcript at its initial top position.

Three local observational fixture runs passed without retries. Their journals recorded the completed-state observer starting at scrollTop 0 and automatically reaching 759 (scrollHeight 1169, clientHeight 410); the answer screenshot then retained 759. This establishes that protocol completion and applied automatic following are distinct conditions. The instrumentation reads layout and can affect scheduling, and did not reproduce the exact CI failure; its cause remains unproven.

Test source `00a121d164f734998c72afb657284f1b4d2f3640` explicitly waits for real overflow, positive automatic scrollTop, distance to bottom at most 72 px and identical geometry in two consecutive polls. It uses the existing default expectation timeout and intervals, never sets the initial bottom position, and fails if automatic following never arrives. The same-task upward scroll/observer regression, visible paragraph, jump control, keyboard focus and following rearm assertions remain unchanged. All six focused projects passed without retries (38.7 s); `npm run check` passed with 156 unit tests and the disabled export guard (45.72 s). The full six-project fixture suite then passed 87 cases with the same 33 conditional skips, zero failures and zero retries (331.70 s test runtime; 355.82 s including the isolated build). Raw reports and current-source screenshots are preserved outside the repository; the unchanged runtime screenshots below remain identified by their original verification source.

Only the assistant test and this verification document change. Runtime, contracts, lockfiles, public tests, workflows, retries and timeouts are unchanged. Public nightly uses `tests/e2e`, but source equality does not imply literal export equality across commits: build IDs, manifest paths and metadata include the source SHA. A new exact-head CI and candidate nightly are required; earlier source runs remain identified as historical evidence. No deployment, paid calls or assistant activation are authorized.

## Enlarged reading and supplementary tooltips

Visual inspection measured a separate real defect: the former text Jump button covered most of the mobile transcript at 200% text size. The control is now icon-only, physically 44×44 px, with a localized accessible name and supplementary tooltip. A stable 68 px reading gutter keeps text separate without conditional resize/anchoring changes. The long-text case checks both 320 and 390 px on both phone projects, and desktop project viewports: a complete visible line, actual text hit-test, separate contained control, horizontal bounds and native product-action targets at least 44 px in each dimension. Only native-card wrapping/padding changed; product and purchase destinations are unchanged.

Paint inspection also found the assistant's tooltip positioner below the panel. An optional positioner class preserves the shared helper's existing default; only assistant callers move above the panel. Tooltip widths are bounded to the viewport minus 16 px. Native Tab/ShiftTab establishes keyboard focus rather than assuming programmatic focus implies focus-visible in Firefox. Tests retain real paint and bounds assertions, Escape dismissal with focus and completed panel retained, reopening, and blur dismissal. Historical 8f diagnostic failures and the WebKit 5 px clip receipt are preserved outside the repository.

Additional current-source WebKit desktop/mobile checks passed (2 cases, 24.1 s): axe on settled fixture answers detects zero violations and 27 passing rules each. The single color-contrast incomplete rule retains three mobile/four desktop nodes: two header-gradient nodes, the existing purchase-button pseudo-element and desktop privacy-link overlap. Browser computed colors converted to sRGB, calculated for final opaque surfaces (opacity 1), give title/header gradient endpoints 12.94/15.55:1, disclosure 9.89/11.71:1 and privacy link/opaque cream 7.34:1, each above normal-text AA 4.5:1. Separate historical settled receipts assert panel opacity 1 and every privacy ancestor at opacity 1. Original receipts retain entrance opacity and do not establish transition/composited contrast. These are limited checks, not complete WCAG certification or a claim about every gradient pixel; the preexisting purchase-button incomplete is outside this UI change.

The extra checks also capture the actual painted tooltip at 200% on WebKit mobile 320/390 and desktop 1440: opacity 1, bounds and centre hit-test are asserted both before and after a screenshot with animations allowed, followed by Escape/focus/panel assertions. Earlier tooltip-named WebKit screenshots made with animation fast-forward did not show the popup after the paint assertion and are retained only as diagnostics, not visual tooltip acceptance.

## Inspected screenshots

Selected current-source PNGs are in `assistant/2026-10-10/`: WebKit settled mobile empty/select and visible final answer, English empty/thinking/history, Firefox 320 px text at 200%, WebKit English 390 px text at 200%, cancellation, WebKit mobile reading at 320/390 px with doubled text, and the actual painted enlarged tooltip at both widths. The main collection fast-forwards finite animations for a settled evidence state; the explicitly named painted-tooltip captures allow animations and assert opacity 1 before/after capture. Reduced-motion behavior is separately asserted. Header, greeting and composer remain opaque and legible. Earlier pre-ready WebKit captures were superseded and are not acceptance evidence.
The complete external capture set includes SHA-256 receipts and exact source/producer revisions. The document records fixture behavior only; English product facts retain the catalog's original language.

## Reproduce from clean checkouts

Use Node from `.nvmrc`, `npm ci`, Python/uv and `uv sync --frozen` in the API checkout. Pin the API checkout to the producer SHA above and install Playwright browsers. `npm run test:e2e:assistant` creates its own isolated enabled export, loopback TLS and fixture database; it does not modify the public `out/`.
For the disabled check, provide documented required build values from `.env.example`, keep `NEXT_PUBLIC_ASSISTANT_ENABLED=false`, run `npm run check`, then `npm run check:assistant-disabled`. Never publish `out-assistant-fixture/`.

## Not verified

Real model behavior/cost; production hosts, TLS/proxy/CORS and activation; physical iOS/Android keyboards and screen readers; field Core Web Vitals; authenticated production traffic. Hostinger currently has no Git repository connected (owner confirmation 2026-10-10); the future selected branch is main. A source release is not a production deployment or activation approval.

## Historical verification (2026-10-05)

The following measurements and screenshots describe the earlier implementation, not current acceptance. The former home text-zoom overflow was corrected by the subsequent reflow work.

### Earlier environment: WSL2, Node 24.21.0

Store branch `feat/native-assistant`; API `pequeverso-assistant-api` `87fc109` (develop, contract
revision 1.2, browser contract = 1.1), fixture provider. No model call, no real key, nothing deployed.

### Results

| Check | Result |
|---|---|
| `npm run check` (Biome, TypeScript 7, 143 unit tests, knip, build + publish guard, media, placeholders, bundle, scene, rendered) | Pass |
| `npm run check:assistant-absent-build` (variable absent, minimal env) | Pass; before the fix the same build emitted the panel chunk and launcher strings |
| `npm run build:standalone` | Pass; guard scans `.next/static` |
| `check:assistant-disabled` on `out/` | 127 files, no marker; rejects `out-assistant-fixture/` (positive control) |
| Disabled export in browsers: `assistant-disabled` + `smoke` specs, Chromium 1440/390 | 30 passed |
| `npm run test:e2e:assistant` (enabled build + real fixture API, HTTPS loopback, 6 projects) | 76 passed, 20 skipped by design, 0 failed; 5 m 23 s including the build. Includes consent-banner stacking, IME Escape, repeated product cards (unique ids, axe ×5 repeats on 3 projects) |

The enabled projects are Chromium desktop, Chromium phone (Pixel 7), Chromium reduced motion,
Firefox desktop, WebKit desktop and WebKit phone (iPhone 13). Skips are deliberate: keyboard tests
on phones, geometry tests per form factor, axe on WebKit, English and reduced-motion checks on one
project each.

### Initial JavaScript (gzip, same machine, `out/` scripts per page)

| Page | develop | branch, disabled | branch, enabled (verification only) |
|---|---|---|---|
| `/` | 193.1 KB | 192.9 KB | 199.1 KB |
| `/grafismo-fonetico/` | 210.5 KB | 210.3 KB | 214.4 KB |
| `/soporte/` | 182.7 KB | 182.4 KB | 188.4 KB |

Enabled adds the launcher (layout chunk, +2.3 KB) and Next's navigation helpers required by
`usePathname`, which split into a shared chunk (+2.5 KB). The panel loads on first use: 18.4 KB JS
+ 1.1 KB CSS gzip. Disabled builds carry no assistant code.

### Observations

- Headless rendering speed of the store pages (2 s `requestAnimationFrame` probe, panel closed):
  `/` about 12 fps in Chromium and 1 fps in WebKit; `/soporte/` 59 fps in both. WebKit tests
  therefore drive the assistant from `/soporte/`. This is software rendering in CI-like headless
  browsers, not a field measurement.
- With the root font forced to 200 %, the home hero overflows horizontally on phones (store page,
  not the assistant). The assistant surface follows the visual viewport and fits.

### Screenshots (inspected)

`assistant/desktop-compact-empty.webp`, `desktop-compact-answer.webp`, `desktop-expanded-modal.webp`,
`firefox-desktop-compact.webp`, `webkit-desktop-answer.webp`, `phone-portrait-answer.webp`,
`phone-landscape-webkit.webp`, `phone-text-200-long-text.webp`, `desktop-text-200-long-text.webp`.

### Not verified

Real model answers and cost, production hostnames/TLS/proxy/CORS across two different hosts,
physical devices and on-screen keyboards, screen readers beyond axe and keyboard tests, field Core
Web Vitals, Hotmart purchases.

## Complete static export artifacts

The complete local/runner `out/` contains `.htaccess`, generated from the shared edge rules,
and the absence guard scans 127 text files. Historical downloaded `site-export` verification
artifacts omitted that hidden file and scanned 126 text files. The difference was the inherited
upload default, not a Meta Pixel configuration difference. Those historical downloads are not
complete static deployment packages; the actual builds still generated and guarded `.htaccess`.

CI and nightly now include hidden files only within the existing `out/` export upload path;
Lighthouse uploads also retain hidden JSON reports under their explicit `.lighthouseci` path.
Every CI/nightly export consumer compares the downloaded `.htaccess` byte-for-byte with
`docs/generated/htaccess.txt` before running its checks, so missing or altered edge rules fail
at the artifact boundary. The verified
output has `.htaccess` as its sole hidden file and contains no `.env` or `.git` path. Fresh artifact
inspection must confirm `.htaccess`, its hash against the generated build output, absence of
secret/configuration paths, the actual guard count and `build-info.json` with `assistant: disabled`
before release. Neither this packaging change nor artifact verification deploys anything or
authorizes assistant activation.
