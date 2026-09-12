# Deployment

## Targets

| Environment | Host | Document root | URL variable |
|---|---|---|---|
| `staging` | Hostinger website on a temporary subdomain (`staging.pequeverso.com`, noindex via an `X-Robots-Tag` header added in hPanel or an `.htaccess` override) | `domains/staging.pequeverso.com/public_html` | `NEXT_PUBLIC_SITE_URL=https://staging.pequeverso.com` |
| `production` | Hostinger website for `pequeverso.com` | `domains/pequeverso.com/public_html` | `https://pequeverso.com` |

The static export is uploaded over SSH by the **Deploy** workflow (`.github/workflows/deploy.yml`).
The Hostinger Node.js Web App target is a supported fallback (`NEXT_OUTPUT=standalone`), see ADR-0001.

## One-time setup (owner, hPanel and GitHub)

1. Websites → create the website for `pequeverso.com` (and `staging.pequeverso.com`). Point DNS at
   Cloudflare **DNS-only** (grey cloud) to Hostinger; let Hostinger issue SSL.
2. Advanced → SSH Access: enable, add the public half of a dedicated deploy key.
3. GitHub → Settings → Environments: create `staging` and `production`. On `production` add a
   required reviewer (yourself) and restrict deployment branches/tags to `main` and `v*`.
   Secrets (per environment): `SSH_HOST`, `SSH_PORT` (65002 on Hostinger), `SSH_USER`,
   `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS` (`ssh-keyscan -p 65002 <host>`).
   Variables: `REMOTE_ROOT` (e.g. `domains/pequeverso.com`), `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_CHECKOUT_URL`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_UMAMI_SCRIPT_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`.
4. Run Deploy → `staging` first and execute the verification matrix below.

## What the workflow does

1. Builds the requested tag with the environment variables; refuses placeholders (`check:placeholders:strict`).
2. Uploads `out/` to `$REMOTE_ROOT/releases/<sha>` (rsync, or tar+scp when rsync is missing).
3. Swaps `public_html` (keeps `public_html.previous`; prunes old releases, keeps the last three).
4. Verifies: `build-info.json` sha equals the built commit (served `no-store`), status codes, slash
   redirect, real 404, `?downsell=1` renders, exactly one Hotmart widget container.
5. On failure restores `public_html.previous`.

An HTTP 200 alone is never treated as proof: step 4 is what makes a deployment "verified".

## Verification matrix (staging spike and every production deploy)

```bash
H=https://pequeverso.com
curl -sI $H/ | grep -iE 'strict-transport|x-content-type|content-security|cache-control|server'
curl -sI $H/grafismo-fonetico | head -3                       # 301 → /grafismo-fonetico/
curl -sI "$H/imprime-y-juega/?downsell=1" | head -1           # 200
curl -s -o /dev/null -w '%{http_code}\n' $H/no-such-page/     # 404
curl -sI -r 0-99 $H/media/video/<file>.mp4 | grep -iE 'HTTP|accept-ranges|content-range'  # 206
curl -s $H/build-info.json                                    # sha must match the deployed tag
curl -sI http://www.pequeverso.com/ | head -3                 # 301 → https://pequeverso.com/ (one hop)
curl -sI "$H/shop-2/anything/" | head -1                      # 410
```

Also confirm in hPanel whether the CDN is enabled for the site; if it is, purge after each deploy
(the `build-info.json` check uses `no-store`, but HTML may be cached at the edge).

## Rollback

Re-run **Deploy** with the previous tag, or on the server: `mv public_html.previous public_html`.

## Not covered by automation

Hotmart configuration (sales page URL, funnel stage URLs, thank-you URLs), Search Console
submissions, social bios and the old-domain `.htaccess` block are manual steps in `docs/migration.md`.
