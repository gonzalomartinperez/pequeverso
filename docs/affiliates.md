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

## Site block

Since 2026-10-13 the home is the hub of two products with the same weight
(docs/specs/home-hub.md): the course has its own door in the hero, its own chapter `#bebe` (alias
`#alimentacion-bebe`), a card in the header «Productos» menu and the mobile menu, a mode of the
phone sticky bar and a card in the close.

| Piece | Where |
|---|---|
| Product facts (slug, path, variable, name, audience, stage, topics, guarantee days, `src`, media ids) | `config/affiliates.ts` (`alimentacionBebe`), unit-tested in `tests/unit/affiliates.test.ts` |
| Chapter copy (kicker, title, pain, desire, button label, note, mandatory disclosure, «how it works») | `content/es/home.ts` → `affiliate` |
| Door/menu/sticky labels and the short disclosure | `content/es/hub.ts` → `feeding` |
| Components | `src/features/home/feeding-chapter.tsx` (chapter + how), `door.tsx`, `hub-sticky.tsx`, `closing-band.tsx`, `src/features/hub/products-menu.tsx` |
| Link | `src/features/commerce/AffiliateLink` |
| Legal | `/aviso-legal/#afiliados` (linked from the disclosure), `/terminos/#afiliados`, `/privacidad/` (destinatarios), `/cookies/#afiliados` |

Rules the hub keeps:

- Every link to the course is the navy secondary pill (white in the navy close), never the coral
  purchase CTA: «Ver la guía en Hotmart». It is a plain `<a>` to `/alimentacion-bebe/?src=sitio-home`
  (not `next/link`: the path is an edge 302, not a page), `target="_blank"` (announced to screen
  readers, external icon), `rel="sponsored noopener"`. The same `src` on every link (measurement per
  placement is a future improvement, owner 2026-10-13).
- The disclosure is visible wherever the course appears: the full text («Recomendación con enlace de
  afiliado: si compras, Pequeverso recibe una comisión…», linked to `/aviso-legal/#afiliados`) next to
  the chapter button; the short form («Enlace de afiliado: si compras, Pequeverso recibe una comisión; a
  ti no te cuesta más.») under the hero doors, on the menu cards, in the sticky bar and on the closing
  card, and beside the course link in hub footers and the 404. Since the owner refinement of
  2026-10-17, every product selection (hero, menus, sticky chooser, hub footer and 404) goes
  directly to the configured affiliate redirect; the former `#bebe` selection step is superseded.
  The chapter and its stable anchors remain informational. Purchase/post-purchase footers are unchanged. No price, reviews, ratings or health promises (unit invariant over all of that copy).
- Tracking: one `PequeversoAffiliateClick` (`product`, `cta_position`: `home`, `sticky`, `closing`,
  `destination`) per click, through the pixel and the Conversions API relay. Never `CheckoutIntent`,
  `InitiateCheckout` or `Purchase` (e2e `commerce.spec.ts`).
- Images come only from the manifest (all AI-generated by the owner, ChatGPT 2026-10-12, fictional
  people, `public-repo-approved`, captioned «Imagen ilustrativa.»): `bebe.scene.primera-papilla` (hero
  door, eager, never preloaded), `bebe.cutout.mama-brazos` (chapter figure and menu/sticky thumbnail),
  `bebe.cutout.dispositivos` (the course on a tablet and a phone), `bebe.cutout.bol` (how it works),
  `bebe.scene.menu` (the 4-week menu) and `bebe.cutout.planeta` (decorative, close). Everything but the
  hero door is lazy.
- Without `NEXT_PUBLIC_CHECKOUT_URL_ALIMENTACION_BEBE` the build warns
  (`check-env: warning: … will 404`): set it before publishing. The internal link crawlers
  (`scripts/check-links.ts`, `tests/e2e/navigation.spec.ts`) skip edge-redirect paths.

### Change the product, copy or images

1. Facts: edit `alimentacionBebe` in `config/affiliates.ts` (keep 3–4 topics, the guarantee the
   producer sets in Hotmart). `src` changes the tracking source Hotmart reports for site clicks.
2. Copy: `content/es/home.ts` → `affiliate` and `content/es/hub.ts` → `feeding`. Both disclosure texts
   are asserted by the unit test; change them together.
3. Images: put the new master in the content studio, point the item in `tools/media/sources.json`
   at it (or add a new id and update `media` in the config), then
   `EXTERNAL_STUDIO_ROOT=/mnt/d/07-proyectos/business/pequeverso-content-studio node tools/media/media-build.ts --only bebe`,
   delete the replaced outputs under `public/media/afiliados/`, and run
   `node tools/media/media-build.ts --check` and `npm run check:media`.
4. Another affiliate: add the edge rule first (above), then a new `AffiliateProduct` in
   `config/affiliates.ts`, its copy and media, and render the block for it.
5. `npm run check`, `npm run test:e2e`; the home visual baselines change (nightly
   `update_snapshots`).
