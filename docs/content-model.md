# Content model

Customer-facing copy is neutral Spanish, typed, and lives in `content/es/*.ts`. Business facts
live in `config/` and are imported by copy and components — never retyped.

| File | Holds | Source of truth (read 2026-09-12) |
|---|---|---|
| `config/site.ts` | brand name, tagline, canonical URL, support email, social profiles, theme colour | brand foundations + `social-profiles.json` (private ops repo); env `NEXT_PUBLIC_SITE_URL` |
| `config/commerce.ts` | prices (US$14.99 / 14.99 / 7.49), composition (9 PDF/414 pp; 6 PDF/384 pp/9 resources), guarantee (7 days), checkout URL (env), Hotmart URLs, passthrough allowlist | product README 2026-08-04, Hotmart upload manifests 2026-07-24/26, live landings |
| `content/es/products.ts` | the 9 + 9 resources with real names, page counts and descriptions | `offer-content.mjs` of the published landings |
| `content/es/home.ts` | homepage copy | new (grounded in brand foundations and the product brief) |
| `content/es/grafismo-fonetico.ts` | landing copy incl. the 10 FAQ answers | published landing copy, reviewed |
| `content/es/imprime-y-juega.ts` | upsell/downsell copy incl. 9 FAQ answers | published post-purchase copy, reviewed |
| `content/es/gracias.ts` | thank-you guidance | published thank-you page, condensed |
| `content/es/legal/seller.ts` | seller identity — contains `[[PLACEHOLDERS]]` until supplied | **owner input required** (docs/legal-checklist.md) |

## Rules

- No testimonials, ratings, results, learning guarantees or "as seen in" claims. Content describes
  what the material contains and how it is used.
- Price anchors ("valor total US$99.99") are not shown: they were never a real prior price. The
  only strikethrough is the downsell's "Oferta anterior US$14.99", which is the price actually
  shown in the previous funnel step.
- The guarantee period is a single value (`guaranteeDays`) used by every page. Changing it is a
  business decision that must match the Hotmart product setting (EU sales require Hotmart's
  minimum; see docs/legal-checklist.md).
- Product names: public name "Grafismo Fonético"; the internal name "Trazos y Sonidos" never
  appears in customer copy (CI content invariant in `tests/unit`).
- Localization: one neutral-LATAM version (`lang="es"`). Voseo (AR) and peninsular (ES) variants
  from the WordPress era are not shipped in v1; they can return as build-time locale files.

## Adding or changing copy

1. Edit the typed object; keep keys stable (components import them).
2. If a fact changes (price, count, guarantee), change `config/`, not the copy.
3. Run `npm run check` — unit tests assert the documented composition and prices.
4. Record business-facing changes in `CHANGELOG.md` and, if it is a decision, in `docs/decisions/`.
