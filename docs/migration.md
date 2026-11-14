# Migration and cutover: the old WordPress landings → pequeverso.com

The store moved from WordPress landings on the previous operator domain to `pequeverso.com`
(registered 2026-09-12 at Cloudflare Registrar; Hostinger Node.js Web App behind the Cloudflare
proxy). The cutover is finished:

- The live site, the Hotmart product, its sales-funnel steps and the thank-you URLs use only
  `pequeverso.com` (owner confirmed 2026-11-09).
- The previous operator domain is **not renewed and not redirected** (owner decision OD-53,
  DR-14 in `docs/master-plan/owner-decisions.md`): no `.htaccess` block, no forward, no hotfix.
  The old redirect block and the cutover runbook stay in git history (removed in task M1-10).
- Support runs on the mailbox in `config/site.ts` (`supportEmail`); no page shows the old-domain
  mailbox (legal pages also show the seller's contact from `content/es/legal/`).
- `tests/unit/old-domain.test.ts` fails if any tracked file outside the allowlist mentions the old
  domain again.

## Legacy paths on the new domain

`pequeverso.com` still answers the legacy WordPress paths with one redirect hop and the query
intact, so old links and calendar entries keep working. The rules live in
`config/edge-rules.json` (rendered to `.htaccess` and `next.config`) and are tested in
`tests/unit/edge-rules.test.ts`.

| Legacy path | New path | How |
|---|---|---|
| `/pequeverso/` | `/` | permanent redirect |
| `/pequeverso/grafismo-fonetico/`, `/products/grafismo-fonetico/` | `/grafismo-fonetico/` | permanent redirect |
| `/pequeverso/imprime-y-juega/` (+`?downsell=1`), `/products/kit-imprime-y-juega/` | `/imprime-y-juega/` (query preserved) | permanent redirect |
| `/pequeverso/grafismo-fonetico/gracias/`, `/products/grafismo-fonetico-gracias/` | `/grafismo-fonetico/gracias/` | permanent redirect |
| `/shop-2/*` (URLs of the domain's previous owner, still indexed by Google) | — | 410 |

Site policy: trailing-slash canonical, `www`→apex and `http`→`https` in one hop. HSTS is staged in
`config/edge-rules.json` (`hsts.rollout`, roadmap M3-5, owner decision PV-D9): `max-age=300` (live
today) → `max-age=604800` (first deploy that carries M3-5, M7) → `max-age=31536000;
includeSubDomains` seven days later, after the owner confirms no subdomain is served over plain HTTP.
No `preload`. Browsers cache HSTS for its whole `max-age`, so a rollback means serving `max-age=0`
over HTTPS, not reverting the config. Post-purchase
and legal pages are `noindex`; the sitemap lists the indexable routes.

## External references (all point at pequeverso.com)

The Hotmart funnel mapping, the Next.js adaptation of the sales-funnel widget and the end-to-end
purchase checklist live in `docs/hotmart-funnel.md`.

1. **Hotmart**: product sales page URL, sales-funnel stage URLs (upsell
   `https://pequeverso.com/imprime-y-juega/`, downsell `.../imprime-y-juega/?downsell=1`) and the
   external thank-you URLs (`https://pequeverso.com/grafismo-fonetico/gracias/`).
2. **Social bios** (`@somospequeverso` on Instagram, TikTok, Facebook, YouTube) and Metricool
   defaults: `https://pequeverso.com/grafismo-fonetico/?utm_source=<network>&utm_medium=social`.
3. **Meta**: domain verification for `pequeverso.com`; pixel traffic permissions.
4. **Private ops repo**: `product.config.json` public URLs, `url-change-log.md`, media map.

Any new URL change follows the same order: edge rule and test first, then the external references,
then Google Search Console (submit `https://pequeverso.com/sitemap.xml`).

## Rollback

A bad site deploy is rolled back by reverting the commit on `main` (Hostinger rebuilds every merge
to `main`); check `https://pequeverso.com/build-info.json` for the reverted SHA.
