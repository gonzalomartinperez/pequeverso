# Deployment

## How it works

pequeverso.com is a Hostinger website (LiteSpeed serving `public_html`) fronted by Cloudflare's
proxy (SSL and CDN as configured by the owner in hPanel/Cloudflare). Deployment uses
**Hostinger's Git integration** — no SSH, no server-side build:

1. The **Deploy** workflow (`.github/workflows/deploy.yml`, manual, `production` environment with
   required approval) builds the requested tag with the environment's `NEXT_PUBLIC_*` variables,
   refuses `[[PLACEHOLDER]]` tokens and unconfirmed media rights, and publishes the exported
   `out/` folder (`index.html` tree, `_next/static`, `media/`, `.htaccess`, `build-info.json`)
   as a single orphan commit on the **`deploy`** branch (`deploy-staging` for staging).
2. Hostinger's Git deployment (hPanel → Websites → Advanced → **Git**) pulls that branch into
   `public_html`. With auto-deploy enabled, Hostinger's webhook pulls on every push to the branch.
3. The workflow polls `https://pequeverso.com/build-info.json` (served `Cache-Control: no-store`)
   until its `sha` equals the built commit, then runs `scripts/smoke.mjs` (status codes, slash
   redirect, real 404, `?downsell=1`, exactly one Hotmart widget container). Only then is the run
   green: an HTTP 200 alone never counts as a verified deployment.

The Node.js Web App target (`NEXT_OUTPUT=standalone`) remains a documented fallback (ADR-0001)
and is not used.

## One-time setup (owner, hPanel and GitHub)

1. hPanel → Websites → pequeverso.com → Advanced → **Git**:
   - Repository: `https://github.com/gonzalomartinperez/pequeverso` (public — no deploy key needed)
   - Branch: `deploy` · Directory: leave empty (deploys into `public_html`)
   - Create, then enable **Auto deployment** and copy the webhook URL if hPanel asks you to add
     it in GitHub (Settings → Webhooks → push events). Newer hPanel versions register it for you.
   - Do the same for `staging.pequeverso.com` with branch `deploy-staging` if you keep a staging site.
2. GitHub → Settings → Environments: `production` (required reviewer = you; deployment branches
   `main` and tags `v*`) and `staging` already exist. Variables per environment:
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CHECKOUT_URL` (set), `NEXT_PUBLIC_META_PIXEL_ID`,
   `NEXT_PUBLIC_UMAMI_SCRIPT_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (optional). No secrets are required.
3. Cloudflare: HTML is not cached (`cf-cache-status: DYNAMIC`); static assets under `/media/`,
   `/_next/static/` and fonts carry `immutable` cache headers and may be cached. If a deploy
   must invalidate cached HTML for any reason, purge the zone in Cloudflare.
4. First deploy: run **Deploy** with `target = production`, `ref = v0.1.0`. Approve the
   environment when prompted. Watch the verification step.

## Verification matrix (after every deploy)

```bash
H=https://pequeverso.com
curl -sI $H/ | grep -iE 'strict-transport|x-content-type|content-security|cache-control|cf-cache-status'
curl -sI $H/grafismo-fonetico | head -3                       # 301 → /grafismo-fonetico/
curl -sI "$H/imprime-y-juega/?downsell=1" | head -1           # 200
curl -s -o /dev/null -w '%{http_code}\n' $H/no-such-page/     # 404
curl -sI -r 0-99 "$H/media/video/$(curl -s $H/grafismo-fonetico/ | grep -o 'media/video/[^"]*\.mp4' | head -1 | sed 's#media/video/##')" | grep -iE 'HTTP|accept-ranges|content-range'  # 206
curl -s $H/build-info.json                                    # sha must match the deployed tag
curl -sI https://www.pequeverso.com/ | head -3                # 301 → https://pequeverso.com/
curl -sI "$H/shop-2/anything/" | head -1                      # 410
```

## Rollback

Re-run **Deploy** with the previous tag (the `deploy` branch is replaced and Hostinger pulls
again). Emergency alternative: in hPanel → Git, redeploy the previous commit of `deploy`.

## Not covered by automation

Hotmart configuration (sales page URL, funnel stage URLs, thank-you URLs), Search Console
submissions, social bios and the old-domain `.htaccess` block are manual steps in `docs/migration.md`.
