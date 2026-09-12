# Deployment

## Two supported Hostinger modes (same repository, no SSH, no secrets)

| | **Node.js Web App** (currently connected in hPanel) | **Website + Git deployment** (static export) |
|---|---|---|
| What Hostinger does | Clones the connected branch, runs `npm install` + `npm run build` on its builder (Node 24, GLIBC 2.28), forces `output: 'standalone'`, starts the app | Pulls the connected branch into `public_html` as plain files; no build |
| What the repo does | `next.config.mjs` detects the `/hbuilds/` builder and attaches redirects/headers from `config/edge-rules.json`; `npm run build` uses `--webpack` (native SWC/Turbopack bindings cannot load on GLIBC 2.28, the WASM fallback can); `npm start` runs the standalone server (`scripts/start.mjs`) | The Deploy workflow builds `out/` and publishes it to the orphan **`deploy`** branch with `.htaccess` (generated from the same edge rules) |
| Branch to connect in hPanel | **`release`** (recommended — only commits approved in the Deploy workflow) or `main` (every merged PR deploys immediately, gated only by CI) | **`deploy`** |
| Revision check | `https://pequeverso.com/build-info.json` (`Cache-Control: no-store`) | same |
| Trade-offs | Idle process stop (cold start on first visit), no rollback UI in hPanel (re-run Deploy with the previous tag), Hostinger build time ~2–4 min | No cold starts, `.htaccess` fully ours |

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
   `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_UMAMI_*`. `NEXT_PUBLIC_SITE_URL` defaults to
   `https://pequeverso.com`; `NEXT_PUBLIC_CHECKOUT_URL` defaults to the documented checkout.
2. GitHub → Settings → Environments → `production`: reviewer = you (already set); variables
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CHECKOUT_URL` (set), pixel/analytics ids (optional).
3. Cloudflare proxy: HTML responses are `Cache-Control: no-cache` (never CDN-cached); `/media/`,
   `/_next/static/` are `immutable`. Purge the zone only if you change cache rules.

## Verification matrix (after every deploy)

```bash
H=https://pequeverso.com
curl -sI $H/ | grep -iE 'strict-transport|x-content-type|content-security|cache-control|cf-cache-status'
curl -sI $H/grafismo-fonetico | head -3                       # 301/308 → /grafismo-fonetico/
curl -sI "$H/imprime-y-juega/?downsell=1" | head -1           # 200
curl -s -o /dev/null -w '%{http_code}\n' $H/no-such-page/     # 404
curl -sI -r 0-99 "$H/media/video/$(curl -s $H/grafismo-fonetico/ | grep -o 'media/video/[^"]*\.mp4' | head -1 | sed 's#media/video/##')" | grep -iE 'HTTP|accept-ranges|content-range'  # 206
curl -s $H/build-info.json                                    # sha must match the deployed commit
curl -sI https://www.pequeverso.com/ | head -3                # 301 → https://pequeverso.com/ (static mode; in Node mode configure the www redirect in hPanel/Cloudflare)
curl -sI "$H/shop-2/anything/" | head -1                      # 410 (static) / 404 (Node)
```

## Rollback

Re-run **Deploy** with the previous tag (moves `release`/`deploy` back; Hostinger redeploys).

## Not covered by automation

Hotmart configuration (sales page URL, funnel stage URLs, thank-you URLs), Search Console
submissions, social bios and the old-domain `.htaccess` block are manual steps in `docs/migration.md`.
