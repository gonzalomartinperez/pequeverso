# Migration and cutover: digitalproductsteam.com/pequeverso → pequeverso.com

Facts verified 2026-09-12: the old surfaces live on WordPress; `/products/*` aliases 301 to
`/pequeverso/*` through a PHP code snippet (not `.htaccess`); the WordPress sitemap still lists
the stale aliases; `site:digitalproductsteam.com pequeverso` returns nothing (the risk is link
rot in Hotmart, social bios and calendars, not rankings). `pequeverso.com` was registered on
2026-09-12 at Cloudflare Registrar (empty zone). Google still indexes prior-owner URLs
(`/shop-2/...`), which the new site answers with 410. `digitalproductsteam.com` expires
2026-12-22 (hPanel shows the billing date 2026-11-25).

## Route and redirect matrix

| Old (digitalproductsteam.com) | New (pequeverso.com) | How |
|---|---|---|
| `/pequeverso/` | `/` | 301, `docs/migration/old-domain.htaccess` |
| `/pequeverso/grafismo-fonetico/`, `/products/grafismo-fonetico/` | `/grafismo-fonetico/` | 301 |
| `/pequeverso/imprime-y-juega/` (+`?downsell=1`), `/products/kit-imprime-y-juega/` | `/imprime-y-juega/` (query preserved) | 301 |
| `/pequeverso/grafismo-fonetico/gracias/`, `/products/grafismo-fonetico-gracias/` | `/grafismo-fonetico/gracias/` | 301 |
| any other `/pequeverso/<x>` | `/<x>` (new site answers 404) | 301 |
| `/products/`, other product landings, blog, legal pages | unchanged | no redirect |
| `wp-content/uploads/...` media | re-hosted under `/media/` | no redirect; OG re-scraped |

New-site policy: trailing-slash canonical, `www`→apex and `http`→`https` in one hop,
`/shop-2/*` → 410, HSTS `max-age=300` at launch (raise later). Post-purchase and legal pages are
`noindex`; the sitemap lists `/`, `/grafismo-fonetico/`, `/soporte/`.

## External references to update at cutover

The Hotmart funnel mapping, the Next.js adaptation of the sales-funnel widget, the dashboard
changes and the end-to-end purchase checklist live in `docs/hotmart-funnel.md`.

1. **Hotmart** (same hour as DNS): product external sales page URL; sales-funnel stage URLs
   (upsell `https://pequeverso.com/imprime-y-juega/`, downsell `.../imprime-y-juega/?downsell=1`);
   external thank-you URLs for approved / awaiting payment / under analysis
   (`https://pequeverso.com/grafismo-fonetico/gracias/`). Then do one real test purchase and
   record the URLs (and any query parameters) Hotmart actually redirects to.
2. **Buyer communications**: Hotmart email templates or product descriptions that mention the old URL; support address if it changes.
3. **Social bios** (`@somospequeverso` on Instagram, TikTok, Facebook, YouTube) and Metricool
   defaults: `https://pequeverso.com/grafismo-fonetico/?utm_source=<network>&utm_medium=social`.
4. **Meta**: domain verification for `pequeverso.com`; pixel traffic permissions.
5. **Private ops repo**: `product.config.json` public URLs, `url-change-log.md`, media map.

## Cutover sequence

| When | Action | Verify |
|---|---|---|
| T-14 d | Deploy to `staging.pequeverso.com` (noindex + basic auth). Run the full QA matrix (7 widths, keyboard, reduced motion, offer modes, widget). Reputation checks for pequeverso.com (Safe Browsing, Spamhaus DBL). Verify the GSC Domain property; review Security & Manual Actions. Trademark clearance search ("Pequeverso": INPI AR, EUIPO, USPTO, WIPO). | staging curl matrix in docs/deployment.md |
| T-7 d | Supply legal placeholders; decide guarantee value; create the support mailbox; Meta domain verification; prepare the Hotmart URL list and the `.htaccess` block; write the curl matrix for the old domain (expect one hop after https, query intact). | `npm run check:placeholders:strict` passes |
| T-0 (low traffic, ads paused) | Cloudflare **DNS-only** records → Hostinger; SSL issued; run Deploy → production with the release tag; submit the sitemap. Same hour on the old domain: insert the `.htaccess` block, disable the snippet's redirect action, purge LiteSpeed + CDN. Update Hotmart URLs; one live test purchase (checkout → upsell → downsell → gracias). | old-domain curl matrix; `scripts/smoke.ts`; Hotmart redirect URLs captured |
| T+1 d | Submit `old-urls.xml` (the 7 old URLs) in the old GSC property; request indexing of `/` and `/grafismo-fonetico/`; update social bios and Metricool defaults; re-scrape OG in the Meta Sharing Debugger. | GSC shows the new URLs |
| T+1…8 w | Weekly: GSC Pages on both properties, old-domain 404 log, Hotmart upsell/downsell conversion, Meta Events Manager (site events + Hotmart Purchase), uptime ping. T+28 d: CrUX / GSC Core Web Vitals (field data, not lab). | monitoring log in docs/verification |
| T+30 d | Trash the old WordPress pages (they stay restorable for rollback until then). | — |
| T+90 d | Decide WordPress retirement; keep an `.htaccess`-only docroot so redirects survive. | — |

## Rollback

Remove the `.htaccess` block, restore the four WordPress pages, restore Hotmart URLs, purge
caches. The new domain can stay live meanwhile.

## Old domain and email

Keep `digitalproductsteam.com` registered for at least one more cycle (redirects must live ≥ 12
months after cutover, Hotmart buyer emails and social links still point there, and an expired
domain can be re-registered by a third party). Support already runs on `somospequeverso@gmail.com`
(the site never shows the old mailbox); keep a forward from the old `support@` address while
buyers may still reply to old Hotmart emails — if the domain moves its DNS to Cloudflare, free
Email Routing can forward it. Do not cancel hosting (billing 2029-12-08) — the site runs there.

## Old-domain curl matrix

```bash
O=https://digitalproductsteam.com
for p in /pequeverso/ /pequeverso/grafismo-fonetico/ "/pequeverso/imprime-y-juega/?downsell=1&utm_source=x" \
         /pequeverso/grafismo-fonetico/gracias/ /products/grafismo-fonetico/ /products/kit-imprime-y-juega/ \
         /products/grafismo-fonetico-gracias/ /pequeverso/grafismo-fonetico; do
  printf '%s → ' "$p"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$O$p"
done
curl -sI "https://www.digitalproductsteam.com/pequeverso/" | grep -i location   # one hop to pequeverso.com
```
