# Deployment

## Current hosting status

Since 2026-10-13 Hostinger is connected to **main** as a Node.js Web App (standalone build
under `/hbuilds/`). Every merge to `main` (a release from `develop`) is built and published
automatically; no manual Redeploy is needed. Environment variables (for example
`NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE`) are set in hPanel. The repository variable
`HOSTINGER_MAIN_AUTODEPLOY_ENABLED=true` enables the post-deploy verification on main pushes,
which waits until `https://pequeverso.com/build-info.json` reports the merged commit. If the
Hostinger build fails, the site keeps serving the previous build; read the build log in hPanel.
This variable controls verification only: it never deploys or enables the assistant. Keep
`NEXT_PUBLIC_ASSISTANT_ENABLED=false` and verify the actual publishable build.

## Hostinger modes (same repository, no SSH, no secrets)

Production is the Node.js Web App (ADR-0010). The Website + Git column documents the static export,
which is a parity build only until M4-2 retires it; the production host does not serve it.

| | **Node.js Web App** (production, connected to main) | **Website + Git deployment** (static export, parity only until M4) |
|---|---|---|
| What Hostinger does | Clones the connected branch, runs `npm install` + `npm run build` on its builder (Node 24, GLIBC 2.28), forces `output: 'standalone'`, starts the app | Pulls the connected branch into `public_html` as plain files; no build |
| What the repo does | `config/next.ts` (re-exported by `next.config.mjs`) detects the `/hbuilds/` builder and attaches redirects/headers from `config/edge-rules.json`; `npm run build` uses `--webpack` (native SWC/Turbopack bindings cannot load on GLIBC 2.28, the WASM fallback can); Hostinger's Next.js preset starts Next's standalone server directly; the Meta CAPI relay is the route handler `src/app/api/meta/events/route.standalone.ts`, compiled only in standalone builds (`pageExtensions`) | The Deploy workflow builds `out/` and publishes it to the orphan **`deploy`** branch with `.htaccess` (generated from the same edge rules) |
| Branch to connect in hPanel | **`main`** (connected); every merge deploys. `release` remains an optional manual-publication alternative requiring a separate hosting choice | **`deploy`** |
| Revision check | `https://pequeverso.com/build-info.json` (`Cache-Control: no-store`) | same |
| Trade-offs | Idle process stop (cold start on first visit), no rollback UI in hPanel (roll back with a revert PR on `main`; Hostinger rebuilds it), Hostinger build time ~2–4 min | No cold starts, `.htaccess` fully ours; no Node, so no Conversions API relay (`/api/meta/events/` is a 404 the browser ignores) |

Both targets are built in CI on every PR today: the `build` job builds the static export and the
`hosting` job builds and serves the standalone target. The M1-1 CI profiles make standalone the
primary PR build and move the export to the nightly parity job (ADR-0010).

## Workflow map (`.github/workflows`)

| Workflow | When | What | Permissions |
|---|---|---|---|
| `ci.yml` | pull request (also on label changes), push to `main` or `develop`, manual | `classify` (CI profiles from `.github/ci-profile.json`) gates `workflows` + `secrets` + `docs` + `quality`; `quality` → `build` (OFF export) + `hosting` (GLIBC 2.28, WASM SWC, standalone smoke); `build` → eight `browser` legs + `performance`; every job → required `ci-gate` (fail closed) → temporary `ci` alias. Docs-only PRs run only the base jobs and `docs`; push and manual runs run everything; [profile](reference/ci-profile.md) | `contents: read`; `pull-requests: read` on `classify` |
| `post-deploy-verify.yml` | push to `main` when `HOSTINGER_MAIN_AUTODEPLOY_ENABLED=true`, manual (`sha`), reusable call | waits until `build-info.json` reports the commit, smoke, headers, `PW_SET=prod`, informative Lighthouse; job summary with revision and timings | `contents: read` |
| `nightly.yml` | 04:17 UTC, manual (`update_snapshots`) | Chromium + WebKit × 7 widths, visual baselines, clean-clone invariant, full knip, 20 Lighthouse samples (5 × 4 routes), links, bundle analysis; seven logical phases (14 jobs after browser expansion), with a fail-closed aggregate | `contents: read` |
| `deploy.yml` | manual, `production`/`staging` environment approval | gated release below, then `post-deploy-verify` | `contents: write` on the release job only |
| `production-daily.yml` | 09:00 UTC, manual | live-site checks without building: reuses `post-deploy-verify` with the live sha, plus TLS, header matrix, relay probe, checkout link, sitemap/robots, internal links; opens/closes one `production` issue | `contents: read`; `issues: write` on the report job only |
| `supply-chain.yml` | pull request, push to `main` or `develop`, manual | `dependency-review-action` on PRs (fails on high advisories or licences outside the allow-list in the workflow); CycloneDX SBOM of the production tree (`npm sbom`) uploaded as a run artifact | `contents: read` |
| `scorecard.yml` | Monday 07:17 UTC, push to `develop`, manual | OpenSSF Scorecard; SARIF to code scanning and the public Scorecard API | `contents: read`, `security-events: write`, `id-token: write`, `actions: read` |
| `branch-policy.yml` | `pull_request_target` | base `develop` (features) or `main` (releases from `develop`, hotfixes), branch name and PR title policy from the base branch; no checkout, `permissions: {}` | none |

`.github/actions/setup` is the shared composite (Node from `.nvmrc`, npm cache, `npm ci`,
optional cached Playwright browser). `deploy.yml` keeps its setup inline because it checks out the
*requested* tag, which may predate the composite (rollbacks must keep working).

Build-time business values (required by `tools/check-env.ts`, no inline defaults in the app):

| Workflow | `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO` | `NEXT_PUBLIC_META_PIXEL_ID` |
|---|---|---|---|
| `ci.yml` | `https://pequeverso.com` | fake offer `https://pay.hotmart.com/TEST0000000?checkoutMode=10` (tests assert only the origin and `checkoutMode=10`) | fake id + `E2E_EXPECT_CONSENT=1` |
| `nightly.yml` | same | same fake offer | none on purpose (clean-clone assertions in Nightly quality: no banner, no cookies) |
| `deploy.yml` | `vars.NEXT_PUBLIC_SITE_URL`, else `https://pequeverso.com` | `vars.NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO`, else `vars.NEXT_PUBLIC_CHECKOUT_URL`; `staging` may fall back to the fake offer, `production` fails the build without a real one | `vars.NEXT_PUBLIC_META_PIXEL_ID` |
| `post-deploy-verify.yml`, `production-daily.yml` | do not build | — | — |

The `hosting` job is the CI stand-in for the host's builder (`rockylinux:8`, glibc 2.28, Node from
`.nvmrc`, `next build --webpack` with the WASM SWC bindings, `NEXT_OUTPUT=standalone`, `npm start`
smoke-tested). A green `ci` therefore means both targets build and the Node one serves.

Repository settings, not workflows: CodeQL default setup (JavaScript/TypeScript and Actions,
enabled 2026-11-14), secret scanning with push protection, private vulnerability reporting,
"require actions pinned to a full-length commit SHA" (enabled 2026-11-14), Dependabot alerts
(security-update PRs off, OD-75), and the
`ci` required check on the `main` ruleset. A merge queue is not used: one maintainer. Branch flow:
features squash into `develop` (the default branch; nightly runs there); a release is a PR
`develop` → `main` merged with a merge commit. Once hosting is connected, that merge deploys
and the verification variable enables `post-deploy-verify`; hotfixes go to `main` and are merged back into `develop`. PRs into `main`
must be up to date with it.

## Release (`.github/workflows/release.yml`, ADR-0018, OD-78)

No release bot and no token. A normal PR on `develop` bumps the release: it sets `package.json`
`version` (the single version source) and moves the `## [Unreleased]` entries of `CHANGELOG.md`
under `## [X.Y.Z] - YYYY-MM-DD`. It runs the full CI like any change. The release PR
`develop` → `main` (merge commit) then reaches `main`, where `release.yml` (push to `main` only,
`contents: write`) runs `tools/release-notes.ts`, creates the tag `vX.Y.Z` on the merge commit and a
GitHub Release whose notes are that CHANGELOG section (`gh release create`). It skips when the
release exists and fails when the version has neither a section nor a release. Repository settings
already in place: immutable releases and the `release tags` ruleset (no deletion, update or
force-move of `v*` tags). First real run: the M7 promotion. M7 checklist: move `/accesibilidad/` out of `pendingRoutes` in
`tests/browser/smoke.spec.ts` and the localhost-only push in `tools/smoke.ts` into their `routes`
lists (production has no such page until the promotion, so the daily checks skip it).

Relation to the other workflows: Hostinger builds and publishes every merge to `main` by itself, so
`release.yml` neither builds nor deploys and does not depend on `deploy.yml`. `deploy.yml` stays
manual (`workflow_dispatch`, a tag or commit as input) and never creates tags, so a tag made by
`release.yml` is a valid `ref` for it.

## Deploy workflow (`.github/workflows/deploy.yml`)

Manual (`workflow_dispatch`), `production` environment with required approval:

1. Builds the requested tag/commit with the environment's `NEXT_PUBLIC_*` variables.
2. Launch gates: `check:placeholders:strict` (no `[[PLACEHOLDER]]` in customer-facing content) and
   `check:media -- --strict` (every media item `public-repo-approved`).
3. Publishes `out/` to `deploy` (static mode) **and** fast-forwards `release` to the source commit
   (Node app mode). Hostinger picks up whichever branch is connected.
4. Polls `build-info.json` until `sha` equals the built commit, then runs `tools/smoke.ts`.
   An HTTP 200 alone never counts as a verified deployment.

> If hPanel is connected to `main`, Hostinger deploys on every merge and the launch gates above
> are **not** applied. With the owner's selected main flow, verify those launch requirements
> before connecting hosting or merging a publishable release. The optional release branch
> flow would require a separate hosting decision; it is not the current connection plan.

## One-time setup (owner, hPanel and GitHub)

1. hPanel → Websites → pequeverso.com → Node.js Web App → Repository settings: branch **`main`**,
   framework Next.js, build command `npm run build`, start command
   `npm start`, Node 24. Environment variables: `NEXT_PUBLIC_SITE_URL` and
   `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO` (required — the build refuses to run without them),
   `NEXT_PUBLIC_META_PIXEL_ID` (optional), `META_CAPI_ACCESS_TOKEN` (optional, server-only; generate
   it in Events Manager → Settings → Conversions API → Generate access token). See the table below.
   After confirming the connection, enable `HOSTINGER_MAIN_AUTODEPLOY_ENABLED=true` in the
   repository variables and run manual post-deploy verification for the expected main SHA.
2. GitHub → Settings → Environments → `production`: reviewer = you (already set); variables
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CHECKOUT_URL` (required), `NEXT_PUBLIC_META_PIXEL_ID` (optional).
   The Deploy workflow reads only these `vars`; nothing else is inlined.
3. Cloudflare proxy: HTML responses are `Cache-Control: no-cache` (never CDN-cached);
   `/_next/static/` is `immutable` (verified through Cloudflare, `docs/verification/edge/`). Purge
   the zone only if you change cache rules.

### CSP rollback at M7 (no git change)

If the enforced CSP breaks something on the first production deploy (a blocked Hotmart or Meta
resource), set `CSP_MODE=report-only` in hPanel → Environment variables and redeploy: the same
policy is then sent as `Content-Security-Policy-Report-Only` on both targets. Unset it (or
`enforce`) and redeploy to enforce again. Any other value fails `tools/check-env.ts`. The daily
live check accepts the report-only form with a warning until 2026-11-28 (`tools/check-live.ts`,
`CSP_ENFORCED_FROM`), then fails; bump that date together with the M7 date. See ADR-0014.

### Edge settings (owner, dashboard only; PV-D9)

Nothing in the repository can change these. Do them after the M7 deploy of the M3-5 config, then
re-run the `curl -I` commands of `docs/verification/edge/2026-11-14-curl.md` into a new dated file.

1. **Cache of `public/` files** (`/media/*`, `/fonts/*`, `/favicon.ico`, `/robots.txt`). Hostinger's
   LiteSpeed serves them without the Node `headers()`, so they have no immutable header and
   Cloudflare applies its 4 h Browser Cache TTL (`max-age=14400`). Cloudflare → Caching →
   Cache Rules → Create rule: URI path starts with `/media/` or `/fonts/` → **Edge TTL: Ignore
   cache-control header and use 1 year**, **Browser TTL: Override origin, 1 year**. Both folders are
   content-hashed, so this is safe. Leave
   `/favicon.ico` and `/robots.txt` at 4 h. Also set Caching → Configuration → **Browser Cache TTL
   → Respect Existing Headers** so the origin value always wins for `/_next/static`.
2. **Cloudflare Web Analytics beacon off.** Cloudflare → Analytics & Logs → Web Analytics → the site
   → Disable (or remove the site). Check: `curl -s -A "Mozilla/5.0 Chrome/130" -H "Accept:
   text/html" https://pequeverso.com/ | grep -c cloudflareinsights` prints 0. The CSP already
   blocks it (ADR-0014).
3. **HSTS stage 3** (only after seven days on `max-age=604800` and a DNS review): in Cloudflare →
   SSL/TLS → Edge Certificates → HSTS leave it **off** (the origin sends the header; enabling both
   duplicates it), and open DNS → Records to confirm every subdomain of `pequeverso.com` serves
   HTTPS. Then tell the engineering session to merge the stage-3 edit of `config/edge-rules.json`.
   `preload` is never set.
4. Email Address Obfuscation is on (it adds `/cdn-cgi/scripts/.../email-decode.min.js`); harmless,
   and covered by `script-src 'self'`.

## Environment variables (hPanel → Environment variables; GitHub `production` environment)

`npm run build` runs `tools/check-env.ts` first: it validates formats, never prints values
and exits 1 on a malformed one.
`NEXT_PUBLIC_*` values are inlined at build time, so **saving a variable in hPanel triggers a
redeploy**; there is nothing to reload at runtime. `META_CAPI_ACCESS_TOKEN` is read by the Node
server at start (never inlined). Build log line: `tracking: meta=on|off capi=on|off`; server
boot line: `meta-capi: enabled|disabled`.

| Variable | Required | Format | Effect when empty |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | `https://` origin, no trailing slash | build fails (canonicals, sitemap, OG need it) |
| `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO` (or legacy `NEXT_PUBLIC_CHECKOUT_URL`) | yes | starts with `https://pay.hotmart.com/` | build fails (the repository ships no checkout URL) |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional | 15–16 digits | no pixel; the first-visit banner is not shown and "Configurar cookies" opens a necessary-cookies notice. When set, the pixel runs by default and the banner withdraws it (`docs/tracking.md`) |
| `META_CAPI_ACCESS_TOKEN` | optional, **server-only** (never `NEXT_PUBLIC_`, never in the repo or CI) | ≥ 32 characters, no whitespace | the `/api/meta/events/` relay answers `204` and Meta is never called from the server. With the pixel id set too, browser events are mirrored to the Conversions API and deduplicated by event id |
| `NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE` (one `NEXT_PUBLIC_CHECKOUT_URL_<PRODUCT>` per affiliate redirect in `config/edge-rules.json`) | optional; follows the `NEXT_PUBLIC_CHECKOUT_URL_<PRODUCT>` naming standard, but only the redirect reads it at build time (never inlined in pages) | plain `https://` affiliate link (Hotmart hotlink or the producer's page with the affiliate code) | `/alimentacion-bebe/` answers 404. Set: `302` to the link, visitor query appended. Build log line: `affiliate redirects: N` |
| `NEXT_OUTPUT` | never in hPanel | `export` (build script default, parity only) or `standalone` (production) | auto-detected: Hostinger's Node builder gets `standalone` |

Those (plus the affiliate links) are the whole surface: no analytics, consent-mode, test-event or debug variables
exist; debug logging follows `NODE_ENV=development`.

## Verification matrix (after every deploy)

```bash
H=https://pequeverso.com
curl -sI $H/ | grep -iE 'strict-transport|x-content-type|content-security|cache-control|cf-cache-status'
curl -sI $H/grafismo-fonetico | head -3                       # 301/308 → /grafismo-fonetico/
curl -sI "$H/imprime-y-juega/?downsell=1" | head -1           # 200
curl -s -o /dev/null -w '%{http_code}\n' $H/no-such-page/     # 404
curl -sI -r 0-99 "$H/media/video/$(curl -s $H/grafismo-fonetico/ | grep -o 'media/video/[^"]*\.mp4' | head -1 | sed 's#media/video/##')" | grep -iE 'HTTP|accept-ranges|content-range'  # 206
curl -s $H/build-info.json                                    # sha must match the deployed commit
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'content-type: application/json' -H "Origin: $H" -d '{"events":[]}' $H/api/meta/events/  # 204 (no token) / 400 (relay enabled: empty batch rejected); 404 = relay not deployed
curl -s -o /dev/null -w '%{http_code}\n' -X POST $H/api/meta/events   # 308 → /api/meta/events/ (Node mode; the client always posts the slash form)
curl -sI https://www.pequeverso.com/ | head -3                # 301 → https://pequeverso.com/ (static mode; in Node mode configure the www redirect in hPanel/Cloudflare)
curl -sI "$H/shop-2/anything/" | head -1                      # 410 (static) / 404 (Node)
```

## Rollback

Re-run **Deploy** with the previous tag (moves `release`/`deploy` back; Hostinger redeploys). The
workflow file comes from `main`, the built tree from the tag, so any tag since v0.1.0 can be
re-deployed. The verify job then proves the previous `sha` is live; if Hostinger is connected to
`main` instead of `release`, a rollback is a revert PR on `main`.

## Not covered by automation

Hotmart configuration (sales page URL, funnel stage URLs, thank-you URLs; `docs/hotmart-funnel.md`
section 4), Search Console submissions and social bios are manual steps (`docs/migration.md`).

## Daily internal-link and affiliate checks

Production daily checks storefront-origin responses separately from the external merchant.
The crawler uses manual redirects and follows at most eight internal hops. A first external
hop is accepted only from a configured affiliate edge path, with temporary status 302 (static)
or 307 (Next standalone), an HTTPS destination with no credentials/custom port, and an exact
reviewed Hotmart host (`go.hotmart.com`, `pay.hotmart.com` or `hotmart.com`). It does not follow
that destination, so a merchant's country/session/bot policy is not misreported as a broken
storefront link. Other external redirects, missing/invalid destinations, loops, excessive hops
and storefront 4xx/5xx still fail. HEAD 405 keeps the existing GET fallback; HEAD 403 is not bypassed.
Future producer-owned hosts need an explicit monitoring-policy review, not a wildcard exception.
This check proves the public route and approved handoff, not third-party checkout availability,
a purchase, affiliate attribution or fulfillment. No checkout/tracking behavior changes.

The production-daily sparse checkout includes `tools/` and `config/` so it reads the same
committed affiliate paths as the edge-rule generator. Nightly remains the separate export
matrix/visual/clean-clone/Lighthouse ×5/links/bundle gate; a production-daily failure does not imply
that Nightly failed. Original daily failures remain evidence; rerun both appropriate workflows
on integrated refs after corrections and verify every job, rather than changing thresholds.
