# Frontend security patch — 2026-10-17

This change pins Next.js16.4.2, React/React DOM19.3.1 and the development-only
`@next/bundle-analyzer`16.4.2. Node24.21.0 LTS, Playwright1.63.0 and the other supported
pins remain unchanged. It is a bounded security update, not a claim to track every latest patch.

Next.js16.4.1 fixes critical issues in `use cache` and image optimization, and a high-severity
Server Actions denial of service. Version16.4.2 includes those fixes. React's patched RSC
packages require19.3.1 in that line; updating React alone does not replace Next's vendored
server packages. See the [Next security release](https://github.com/vercel/next.js/releases/tag/v16.4.1),
[16.4.2 notes](https://github.com/vercel/next.js/releases/tag/v16.4.2),
[Server Actions advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r)
and [React RSC advisory](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3).

The storefront already uses unoptimized images and sharp0.35.5, and the review did not find
`use server`/`use cache` application directives. This reduces those specific observed triggers;
it is not an exemption from the upstream upgrade recommendation or proof that an unpatched
standalone server is safe. No exploit was run against production. Backoffice Server Actions
are reviewed and patched in its own repository.

## Validation and limits

The patched lockfile was installed locally with `npm ci --ignore-scripts --no-audit --no-fund`.
`npm run check` passed196 unit tests, strict typing/lint, production dead-code checks, the
static disabled build,14 rendered pages, media/scene/bundle budgets. `npm audit --omit=dev`
reported zero known production dependency advisories at this review cut. It does not cover
all development dependencies, OS packages, unpublished vulnerabilities or deployed software.

The final PR must additionally pass its complete CI, including Hostinger GLIBC2.28/WASM SWC
parity, browser/fixture tests, Lighthouse and strict disabled-export inspection. Earlier runs
using16.4.0 are historical evidence, not validation of this patch. See
[PR107](https://github.com/gonzalomartinperez/pequeverso/pull/107) for the final exact-head runs.
The production assistant remains disabled. API/backoffice deployment and VPS capacity are
separate gates; this update grants no deployment, provider spending or activation permission.
