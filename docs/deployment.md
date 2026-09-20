# Deployment

## Two supported Hostinger modes (same repository, no SSH, no secrets)

| | **Node.js Web App** (currently connected in hPanel) | **Website + Git deployment** (static export) |
|---|---|---|
| What Hostinger does | Clones the connected branch, runs `npm install` + `npm run build` on its builder (Node 24, GLIBC 2.28), forces `output: 'standalone'`, starts the app | Pulls the connected branch into `public_html` as plain files; no build |
| What the repo does | `next.config.mjs` detects the `/hbuilds/` builder and attaches redirects/headers from `config/edge-rules.json`; `npm run build` uses `--webpack` (native SWC/Turbopack bindings cannot load on GLIBC 2.28, the WASM fallback can); `npm start` runs the standalone server behind a small front server that serves the Meta CAPI relay (`scripts/start.mjs`, `server/`) | The Deploy workflow builds `out/` and publishes it to the orphan **`deploy`** branch with `.htaccess` (generated from the same edge rules) |
| Branch to connect in hPanel | **`release`** (recommended — only commits approved in the Deploy workflow) or `main` (every merged PR deploys immediately, gated only by CI) | **`deploy`** |
| Revision check | `https://pequeverso.com/build-info.json` (`Cache-Control: no-store`) | same |
| Trade-offs | Idle process stop (cold start on first visit), no rollback UI in hPanel (re-run Deploy with the previous tag), Hostinger build time ~2–4 min | No cold starts, `.htaccess` fully ours; no Node, so no Conversions API relay (`/api/meta/events` is a 404 the browser ignores) |

Both modes are built in CI on every PR (`quality` job builds the static export; `npm run
build:standalone` is the Node parity build you can run locally).

## Deploy workflow (`.github/workflows/deploy.yml`)

Manual (`workflow_dispatch`), `production` environment with required approval:

1. Builds the requested tag/commit with the environment's `NEXT_PUBLIC_*` variables.
2. Launch gates: `check:placeholders:strict` (no `[[PLACEHOLDER]]` in customer-facing content) and
   `check:media -- --strict` (every media item `public-repo-approved`).
3. Publishes `out/` to `deploy` (static mode) **and** fast-forwards `release` to the source commit
   (Node app mode). Hostinger picks up whichever branch is connected.
4. Polls `build-info.json` until `sha` equals the built commit, then runs `scripts/smoke.mjs`.
   An HTTP 200 alone never counts as a verified deployment.

> If hPanel is connected to `main`, Hostinger deploys on every merge and the launch gates above
> are **not** applied. Connect `release` to keep the approval gate.

## One-time setup (owner, hPanel and GitHub)

1. hPanel → Websites → pequeverso.com → Node.js Web App → Repository settings: branch **`release`**
   (or keep `main`, see note), framework Next.js, build command `npm run build`, start command
   `npm start`, Node 24. Environment variables (optional): `NEXT_OUTPUT=standalone` (explicit),
   `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` (server-only; generate it in Events
   Manager → Settings → Conversions API → Generate access token). `NEXT_PUBLIC_SITE_URL` defaults
   to `https://pequeverso.com`; the checkout URL defaults to the registry's public Hotmart checkout.
2. GitHub → Settings → Environments → `production`: reviewer = you (already set); variables
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CHECKOUT_URL` (set), pixel/analytics ids (optional).
3. Cloudflare proxy: HTML responses are `Cache-Control: no-cache` (never CDN-cached); `/media/`,
   `/_next/static/` are `immutable`. Purge the zone only if you change cache rules.

## Environment variables (hPanel → Environment variables; GitHub `production` environment)

`npm run build` runs `scripts/check-env.mjs` first: it validates formats, never prints values
and exits 1 on a malformed one.
`NEXT_PUBLIC_*` values are inlined at build time, so **saving a variable in hPanel triggers a
redeploy**; there is nothing to reload at runtime. `META_CAPI_ACCESS_TOKEN` is read by the Node
server at start (never inlined). Build log line: `tracking: meta=on|off capi=on|off`; server
boot line: `meta-capi: enabled|disabled`.

| Variable | Required | Format | Effect when empty |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | `https://` origin, no trailing slash | defaults to `https://pequeverso.com` (canonicals, sitemap, OG) |
| `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO` (or legacy `NEXT_PUBLIC_CHECKOUT_URL`) | optional override | starts with `https://pay.hotmart.com/` | the registry default (the public Hotmart checkout) is used |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional | 15–16 digits | no pixel; the first-visit banner is not shown and "Configurar cookies" opens a necessary-cookies notice. When set, the pixel runs by default and the banner withdraws it (`docs/tracking.md`) |
| `META_CAPI_ACCESS_TOKEN` | optional, **server-only** (never `NEXT_PUBLIC_`, never in the repo or CI) | ≥ 32 characters, no whitespace | the `/api/meta/events` relay answers `204` and Meta is never called from the server. With the pixel id set too, browser events are mirrored to the Conversions API and deduplicated by event id |
| `NEXT_OUTPUT` | never in hPanel | `export` (default) or `standalone` | auto-detected: Hostinger's Node builder gets `standalone` |

Those four are the whole surface: no analytics, consent-mode, test-event or debug variables
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
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'content-type: application/json' -d '{"events":[]}' $H/api/meta/events  # 204 (no token) / 400 (relay enabled: empty batch rejected)
curl -sI https://www.pequeverso.com/ | head -3                # 301 → https://pequeverso.com/ (static mode; in Node mode configure the www redirect in hPanel/Cloudflare)
curl -sI "$H/shop-2/anything/" | head -1                      # 410 (static) / 404 (Node)
```

## Rollback

Re-run **Deploy** with the previous tag (moves `release`/`deploy` back; Hostinger redeploys).

## Not covered by automation

Hotmart configuration (sales page URL, funnel stage URLs, thank-you URLs), Search Console
submissions, social bios and the old-domain `.htaccess` block are manual steps in `docs/migration.md`.
