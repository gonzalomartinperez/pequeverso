# Native assistant verification (2026-10-10)

Fixture-only verification on WSL2, Node 24.21.0. Store runtime source `74e7457da69f8222cf919d6b58b5eb49f4d84c7e`; API producer `b27d35c9ce2f02e5519b4476001f01c7172d6eb2`, v1 revision 1.3, manifest `fa6df707bb05061a77a60d68fbf0c55a7593e815f1110531a9dbbfaac8f3f71e`.
No paid calls, no real key reads, no deployment. Enabled verification output is explicitly UNPUBLISHABLE and rejected by the publication guard.

## Results

| Check | Result |
|---|---|
| `npm run check` | Pass, 58.54 s; 156 unit tests, lint, types, knip, disabled export and budgets |
| `npm run check:assistant-disabled` | Pass, 127 files; build-info assistant=disabled; enabled fixture positive control rejected with exit 1 |
| `ASSISTANT_API_DIR=<clean API checkout at the producer SHA> npm run test:e2e:assistant` | 87 passed, 33 conditional skips, 0 failed; 7.4 min test runtime, 481.04 s including isolated build |

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

The first PR CI at `c869beb` was green after one WebKit-mobile retry (86 passed, 1 flaky, 33 skips). Its visible-response assertion revealed a real ordering risk: a late ResizeObserver callback could pull a reader back to the bottom before the browser delivered the upward scroll event. This result was investigated before accepting the merge.

The pre-fix reproduction forces the registered native observer callback in the same task as a reader scroll: scrollTop moved 762→0, then the observer incorrectly restored 762 and hid the paragraph. Source `74e7457` synchronously records actual programmatic positions and checks reader movement before following a resize. The same reproduction retains scrollTop 0 and a visible paragraph through eight frames. The existing streamed-answer case tests this ordering in every project, keeps strict viewport and jump-button assertions, and proves that jump-to-latest restores following. The final local collection above has zero retries, failures or new skips. New exact-head CI and nightly remain required; the earlier CI is not relabelled as clean.

Additional ad-hoc WebKit desktop/mobile axe checks against settled fixture answers passed (2 cases, 28 s, zero detected violations, 27 passing rules each). Raw color-contrast incompletes remain visible: header gradient, existing purchase-button pseudo-element and desktop privacy-link overlap. Browser computed colors converted to sRGB, calculated for final opaque surfaces (opacity 1), give title/header gradient endpoints 12.94/15.55:1, disclosure 9.89/11.71:1 and privacy link/opaque cream 7.34:1, each above normal-text AA 4.5:1. Separate settled receipts assert panel opacity 1 and record every privacy ancestor at opacity 1. The original receipts also retain entrance opacity; they do not establish transition contrast or composited contrast during animation. These are limited checks, not complete WCAG certification or a claim about every gradient pixel; the preexisting purchase-button incomplete is outside this UI change.

## Inspected screenshots

Selected original PNGs are in `assistant/2026-10-10/`: WebKit settled mobile empty/select and visible final answer, English empty/thinking/history, Firefox 320 px text at 200%, WebKit English 390 px text at 200%, and cancellation. Captures fast-forward finite animations for a settled evidence state; reduced-motion behavior is separately asserted. Header, greeting and composer remain opaque and legible. Earlier pre-ready WebKit captures were superseded and are not acceptance evidence.
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
