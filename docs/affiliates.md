# Affiliate redirects

Pequeverso recommends third-party products (Hotmart affiliate programme) without a landing page of
its own: a short, clean path on `pequeverso.com` redirects to the owner's affiliate link. Copy,
social posts and images show the path (`pequeverso.com/alimentacion-bebe`), never the raw link.
Business decision and campaign: `pequeverso-marketing` → `decisions/DEC-2026-10-12-afiliado-alimentacion-bebes.md`.

| Path | Variable (build time) | Product |
|---|---|---|
| `/alimentacion-bebe/` | `NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE` | «Guía de Alimentación para Bebés» (Hotmart course) |

## How it works

- `config/edge-rules.json` holds the rule with `destinationEnv` instead of `destination`, and
  `permanent: false`. The repository never contains the affiliate link (AGENTS.md: deployment
  values live in environment variables).
- `scripts/lib/edge-rules.ts` resolves the variable at build time. Static target:
  `out/.htaccess` gets `RewriteRule ^alimentacion-bebe/?$ <link> [R=302,L,QSA,NE]` (the visitor's
  query, e.g. `?src=facebook`, reaches Hotmart). Node target: `redirects()` in `config/next.ts`.
- Variable empty → no rule → the path answers 404 (no broken redirect ships). A malformed value
  (not a plain `https://` URL: spaces, quotes or `$`) fails `scripts/check-env.ts` and the build.
- The golden `docs/generated/htaccess.txt` is always rendered without variables, so it never
  contains the link.
- 302 (not 301) so browsers and Meta do not cache the destination: the owner can change the link by
  editing the variable and rebuilding.

## Set or change the link (owner)

1. Node.js Web App: hPanel → Websites → pequeverso.com → Environment variables →
   `NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE` = the affiliate link as Hotmart gives it (hotlink or the producer's checkout/sales page with the affiliate code). Saving
   rebuilds.
2. Static export via the Deploy workflow: GitHub → Settings → Environments → `production` →
   variable with the same name; then run Deploy.
3. Check: `curl -sI https://pequeverso.com/alimentacion-bebe/ | grep -i location` shows the link.

## Add another affiliate

1. New rule in `config/edge-rules.json`: `id: affiliate-<slug>`, `source: /<slug>/`,
   `destinationEnv: NEXT_PUBLIC_CHECKOUT_URL_<SLUG>`, `permanent: false`. Slug: short, descriptive, no
   accents, hyphenated Spanish words.
2. Pass the variable in `.github/workflows/deploy.yml` (build step `env`) and list it in
   `.env.example`, `docs/deployment.md` and the table above.
3. `node scripts/gen-htaccess.ts`, `npm run check`, PR into `develop`.
