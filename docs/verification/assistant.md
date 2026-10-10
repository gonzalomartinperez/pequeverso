# Native assistant verification (2026-10-10)

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
