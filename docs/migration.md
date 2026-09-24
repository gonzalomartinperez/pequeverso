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

## Status (2026-09-24)

Done: `pequeverso.com` live on Hostinger (Node.js Web App builds `main`; Cloudflare proxy; SSL),
every page on the design system, legal pages with the real seller data (no placeholders), Meta
Pixel + Conversions API relay live (`NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` in
hPanel), checkout URL from `NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO`, guarantee kept at 7
days, support on `somospequeverso@gmail.com`, daily production checks (`production-daily.yml`).
Pending: everything in the runbook below — the old domain and the Hotmart funnel still point at
WordPress.

## Cutover runbook (owner, ~1 hour, low-traffic window, ads paused)

| # | Action | Where | Verify |
|---|---|---|---|
| 1 | Confirm the upsell (US$14,99) and downsell (US$7,49) offers exist and are active in the sales funnel; do not reuse legacy offer ids. | Hotmart → Herramientas → Funnel de ventas | both steps show an active offer |
| 2 | Set the product's sales page URL to `https://pequeverso.com/grafismo-fonetico/`. | Hotmart → Productos → (producto) → página de ventas | Hotmart product page links to the new URL |
| 3 | Set the funnel stage URLs: upsell `https://pequeverso.com/imprime-y-juega/`, downsell `https://pequeverso.com/imprime-y-juega/?downsell=1`. | Hotmart → Herramientas → Funnel de ventas | stage previews open the new pages |
| 4 | Set the external thank-you URL (approved, awaiting payment, under analysis) to `https://pequeverso.com/grafismo-fonetico/gracias/`. | Hotmart → Productos → (producto) → página de agradecimiento / post-venta | — |
| 5 | Pixel settings: keep Purchase (Web + API) and checkout visits on; turn **off** the Hotmart product-page visits event (the site emits ViewContent). | Hotmart → Herramientas → Píxel de seguimiento | — |
| 6 | Same hour on the old domain: insert `docs/migration/old-domain.htaccess` at the top of the WordPress `.htaccess`, disable the PHP snippet's `/products/*` redirect, purge LiteSpeed + CDN. | hPanel → digitalproductsteam.com → File manager | old-domain curl matrix below: one 301 hop, query intact |
| 7 | Test purchase (low value, refund inside the guarantee): landing with `?utm_source=e2e` → CTA → pay → upsell (decline) → downsell (decline or accept) → gracias. Record the exact URLs and query Hotmart used. | browser | checklist `docs/hotmart-funnel.md` §5; Events Manager shows PageView/ViewContent/CheckoutIntent (Browser + Server, deduplicated) and Hotmart's Purchase |
| 8 | Request the refund of the test purchase. | refund.hotmart.com | refund confirmed by email |
| 9 | Google Search Console: add the Domain property `pequeverso.com`, submit `https://pequeverso.com/sitemap.xml`, request indexing of `/` and `/grafismo-fonetico/`; in the old property submit the old URLs. | GSC | sitemap "Success" |
| 10 | Meta: verify the domain `pequeverso.com` in Business Settings; re-scrape `/` and `/grafismo-fonetico/` in the Sharing Debugger. | Meta Business | domain "Verified" |
| 11 | Update social bios and Metricool defaults to `https://pequeverso.com/grafismo-fonetico/?utm_source=<network>&utm_medium=social`; update Hotmart product descriptions/emails that mention the old URL. | Instagram, TikTok, Facebook, YouTube, Metricool, Hotmart | links open the new landing |
| 12 | Start traffic (ads, posts). Watch the first day: `production-daily` issue stays closed, Events Manager, Hotmart sales and upsell/downsell take rate. | GitHub, Meta, Hotmart | — |

Owner legal follow-ups (from `docs/legal-checklist.md`, not blocking the cutover): register the
customer database with the AAIP; ask the accountant about the ARCA "Data Fiscal" QR; consider a
15-day guarantee (above the 10-day Argentine revocation and Hotmart's EU minimum); answer every
arrepentimiento email within 24 h with a reference; a lawyer's review of the legal pages.

## After cutover

| When | Action |
|---|---|
| T+1 d | GSC coverage for the new URLs; social bios checked; OG previews checked. |
| T+1…8 w | Weekly: GSC (both properties), old-domain 404s, Hotmart funnel conversion, Events Manager match quality; `production-daily` runs every day. T+28 d: field Core Web Vitals (CrUX/GSC). |
| T+30 d | Trash the old WordPress pages (restorable until then for rollback). |
| T+90 d | Decide WordPress retirement; keep an `.htaccess`-only docroot so redirects survive ≥ 12 months. |

## Rollback

Restore the four Hotmart URLs (steps 2–4) to the old WordPress pages, remove the `.htaccess`
block, purge caches. `pequeverso.com` can stay live meanwhile; a bad site deploy is rolled back
by reverting the commit on `main` (Hostinger redeploys it).

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
