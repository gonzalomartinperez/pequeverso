# Node and Playwright toolchain alignment

This separate dependency change selects Node 24.22.0 LTS and Playwright 1.64.1.
Only the three Playwright package nodes change in the lock. Next 16.4.2,
React/React DOM 19.3.1, TypeScript, Oxc, application code, commerce, consent and
tracking stay unchanged. A workflow comment now reflects the owner-confirmed main hosting
connection. The native CI API toolchain advances only uv 0.13.0→0.13.1 to match the
reviewed Python 3.15.0 producer, without changing steps, permissions, caches or gates.

[Node 24.22.0](https://nodejs.org/en/blog/release/v24.22.0) bundles npm 11.19.1;
the versioned [platform requirements](https://github.com/nodejs/node/blob/v24.22.0/BUILDING.md)
retain Linux x64 glibc >= 2.28. This supports the Hostinger parity candidate, not a
claim about the managed host's actual Node patch. The Rocky8 WASM/webpack,
standalone startup and expected-SHA smoke remain required CI checks.

[Playwright 1.64.1](https://github.com/microsoft/playwright/releases/tag/v1.64.1)
fixes routed Chromium cross-origin preflight redirects. The
[1.64.0 behavior changes](https://github.com/microsoft/playwright/releases/tag/v1.64.0)
include device-descriptor screen propagation and hidden-iframe visibility.
The pinned engines are Chromium 156.0.8078.4, Firefox 157.0 and WebKit 27.2.

## Compatible producer pin

The owner-reviewed API releases PR #73 (runtime cohort) and PR #76 (manual Dependabot
profile) promoted final `ce17289b3e5b0be6f9235609c65b5b5f7c907df2` to main. The pin script copied its
committed contracts; all 19 artifact blobs are byte-identical to the previous
`8ba99fe` producer, with manifest SHA256 unchanged. Only source.json and the fixture
revision change. This does not change wire fields, assistant availability or the
storefront activation switch. The final native CI must install this exact producer
with its frozen lockfile; earlier API 8ba fixture evidence remains identified below.

## Initial local evidence before the separate final UX increment

The application baseline is store `17c2fc1`; the later history reconciliation to
0bc3bda has the identical tree. The local producer was API 8ba99fe in fixture mode,
with no real key or provider call. Node 24.22.0/npm 11.19.1 were recorded explicitly.
Browser binaries were installed into a task-owned cache with GC disabled; the
shared cache was untouched.

| Check | Observed result |
|---|---|
| Frozen clean install | Passed |
| Complete npm check |196 unit tests, 14 structural pages, budgets passed |
| Explicit public disabled guard |126 text files, no assistant runtime |
| All existing visual comparisons | 12 PASS, 0SKIP/errors/flaky/retries; 101.308 s |
| Reference images |All 12 byte-identical before and after; no regeneration |
| Home reflow and responsive focus | 4 PASS / 1 contractual SKIP across Chromium/Firefox/WebKit |
| Native focus | 33 PASS / 9 geometry SKIP, 42 identities, 6 projects, 3 engines; 285.246 s |
| Native errors and retries | 0 unexpected/top-errors/flaky/retries |
| Functional shard inventory | 478 = 239 + 239, disjoint and complete |
| Native shard inventory | 258 = 129 + 129, disjoint and complete |

Home focus covered 320–1920 px and text 200% at 320/390. The original Chromium 1440
zoom case was skipped by its existing 390-only annotation; the actual Chromium 390
case was then run separately and passed. The native cases covered keyboard and
focus, phone portrait/landscape, text 200%/reduced viewport, cancel, connection
failure/recovery, affiliate cards and comparison. Nine skips are the preexisting
geometry assignments (two mobile keyboard, four desktop phone, three duplicated
explicit-zoom projects). Inventory enumeration is not execution evidence.

Original JSON results and logs are retained separately. Selected screenshots were
visually reviewed by the implementing and coordinating agents; no human review is
claimed. Cropped conversation/table scroll states are test evidence, not replacement
commercial gallery photos. Enabled output is marked UNPUBLISHABLE; publishable
output remains disabled. Local servers were stopped after the focused run.

## Remaining release gates

The final integrated source check after the separate UX/navigation changes, independent
final source review, complete protected PR CI (including Hostinger
WASM parity), the integrated Nightly and any authorized release/post-deploy checks
must still finish. No test timeout, retry, mask, comparison tolerance or negative
architecture fixture was changed. These local results do not certify the VPS,
managed-host runtime patch, provider quality or production activation.
