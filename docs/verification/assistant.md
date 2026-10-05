# Native assistant verification (2026-10-05, WSL2, Node 24.21.0)

Store branch `feat/native-assistant`; API `pequeverso-assistant-api` `87fc109` (develop, contract
revision 1.2, browser contract = 1.1), fixture provider. No model call, no real key, nothing deployed.

## Results

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

## Initial JavaScript (gzip, same machine, `out/` scripts per page)

| Page | develop | branch, disabled | branch, enabled (verification only) |
|---|---|---|---|
| `/` | 193.1 KB | 192.9 KB | 199.1 KB |
| `/grafismo-fonetico/` | 210.5 KB | 210.3 KB | 214.4 KB |
| `/soporte/` | 182.7 KB | 182.4 KB | 188.4 KB |

Enabled adds the launcher (layout chunk, +2.3 KB) and Next's navigation helpers required by
`usePathname`, which split into a shared chunk (+2.5 KB). The panel loads on first use: 18.4 KB JS
+ 1.1 KB CSS gzip. Disabled builds carry no assistant code.

## Observations

- Headless rendering speed of the store pages (2 s `requestAnimationFrame` probe, panel closed):
  `/` about 12 fps in Chromium and 1 fps in WebKit; `/soporte/` 59 fps in both. WebKit tests
  therefore drive the assistant from `/soporte/`. This is software rendering in CI-like headless
  browsers, not a field measurement.
- With the root font forced to 200 %, the home hero overflows horizontally on phones (store page,
  not the assistant). The assistant surface follows the visual viewport and fits.

## Screenshots (inspected)

`assistant/desktop-compact-empty.webp`, `desktop-compact-answer.webp`, `desktop-expanded-modal.webp`,
`firefox-desktop-compact.webp`, `webkit-desktop-answer.webp`, `phone-portrait-answer.webp`,
`phone-landscape-webkit.webp`, `phone-text-200-long-text.webp`, `desktop-text-200-long-text.webp`.

## Not verified

Real model answers and cost, production hostnames/TLS/proxy/CORS across two different hosts,
physical devices and on-screen keyboards, screen readers beyond axe and keyboard tests, field Core
Web Vitals, Hotmart purchases.
