# CRO plan

Scope: pequeverso.com for a parent on a phone (often inside Instagram, TikTok or Facebook in-app browsers) buying a single-price printable kit through Hotmart, plus an honestly disclosed affiliate recommendation. Evidence base: `research/07-cro-seo-analytics.md` (sources marked there as primary or secondary), `research/13-sites-master-uiux.md`, `audit.md`. Legal items are research notes, not legal advice.

Honest framing of effect sizes: at low traffic most micro-optimizations will not reach statistical significance ([07] section 8). The plan therefore ships evidence-based best practice without testing, fixes speed and measurement first, and reserves experiments for large bundled changes.

## 1. Value proposition and the 5-second test

| Item | Today | Target |
|---|---|---|
| Hub promise | "Un pequeño universo para cada etapa." plus "Primeras letras o primeras comidas. Encuentra el recurso para su etapa." (evocative, not concrete) | Same h1 plus a concrete lead naming both products, ages and format (`design-playbook.md` section 10); doors visible in the first viewport at 320 x 568 and 390 x 844 |
| Kit h1 | "Kit Grafismo Fonético" | "Kit imprimible de Grafismo Fonético para niñas y niños de {kit_age}" with the one-line promise, real sheet image, price, currency, "pagas en Hotmart", guarantee and format in the buy box |
| Above-the-fold clutter | Consent banner overlaps the hub hero on first load | Banner after first paint, at most 168 px, never over price or CTA |

The 5-second test (owner-optional human input, plus an automatic proxy): five parents see the hub and the kit page at 390 x 844 for five seconds and answer "what is sold, for whom, for how much, how do I buy it". Pass: at least 4 of 5 answer all four. Automatic proxy: an independent evaluator agent receives the two screenshots and answers the same four questions; a miss fails the C1 axis in the scorecard. The first real test is scheduled after M5; before it, C1 is scored by the evaluator only.

## 2. Trust without fabricated proof

Inventory of honest, available proof (all real, none invented): the real worksheets (page wall, gallery), the syllable playground (interactive proof that needs no claims), named author and method (`creator-note`, with an "Actualizado" date), Hotmart secure payment statement, guarantee in plain language, transparent contact and legal identity on the legal pages, refund path, affiliate disclosure, "Imagen ilustrativa." labels.

| Rule | Mechanism |
|---|---|
| Never: invented testimonials, review counts, buyer counts, countdowns, "quedan N", stock "parents" with fake names, AI-generated reviews | `tests/unit/content-invariants.test.ts` extended with patterns for counters and urgency words; the FTC fake-review rule is the benchmark ([07] section 4) |
| Proof slot exists but ships empty never | Component `features/proof` is created only with the first consented asset; until then the slot is absent from the DOM |
| Early stage language | Use the "lanzamiento" line only if the owner confirms there are no buyers yet; never state "primeras familias" as a count |
| Real photos | Written consent, first name and country only (PV-D11); photos of children only with documented parental consent |
| Free sample | One or two real sample pages as direct download with no data capture (PV-D6); the email opt-in sample comes after the legal pack (PV-D8) |
| Guarantee | Hotmart allows one global guarantee: 7 days (`guaranteeDays`). Longer legal windows (Spain/EU 14 days; Argentina and Chile 10 days) are honored by email and stated plainly on the support page (PV-D2). Copy never promises more or less than config plus that process; the invariants test compares copy with both |
| Payment security | One line naming Hotmart next to every CTA (Baymard: distrust of card handling is 19% of abandonment, [07] section 2) |

## 3. Purchase path to Hotmart

Current flow (implemented and tested): hub door to kit page, `CheckoutLink` to `pay.hotmart.com/<offer>?checkoutMode=10` in the same tab, allowlisted parameters forwarded (`utm_*`, `a`, `angle_key`, `ad_code`, `country`, `sck`, `src`, `xcod`, `fbclid`), `off` and `ref` never forwarded, `sck=pv-gf-<position>`; Hotmart owns `InitiateCheckout` and `Purchase`; post-purchase upsell and downsell run through the Hotmart widget only; the thank-you URL is never proof of payment.

Target improvements:

1. Everything a parent needs before the click is in the buy box: price and currency note, "pagas en Hotmart", format and delivery, guarantee days, support link. One CTA label across the page ("Obtener el kit"), CTA rhythm of at most four coral CTAs plus sticky (`design-playbook.md` 5.1).
2. Click feedback within 100 ms, "Abriendo Hotmart…" state for slow hand-offs, timeout notice with the support email (prevents double clicks, covers slow in-app browsers). Same tab on every device.
3. Per-block `sck` positions stay (`header`, `hero`, `mid`, `final`, `sticky`); this is the only attribution that crosses the domain boundary ([07] section 9). Add a unit test that every CTA on the kit page has a distinct, allowed position and at most 30 characters.
4. Local price: show the USD reference price with the existing local-currency note (Hotmart converts to the buyer's currency, including euros for Spain, and shows the final total with taxes before payment). Never hardcode exchange rates ([07] "do not do"). Spain and EU buyers expect the total with VAT: confirm in PV-D10 that Hotmart's checkout shows it, and that the page does not imply a price "sin impuestos" for them (the existing note "+ impuestos aplicables según el país" stays).
5. **PV-D10 owner verification** on a phone for MX, CL, CO, PE, AR: currency shown, payment methods (OXXO, SPEI, Mercado Pago, card), language, and whether any order bump hides a local method. Argentina: Hotmart reportedly stopped local-partner payments on 2023-04-28 ([07] section 2, secondary source); do not promise Argentine local methods on the site. Record screenshots under `docs/verification/checkout/` (kept small).
6. Order bump only if it is a true complement and PV-D10 shows it does not remove local methods; measure take rate and refund rate; none today.
7. Measurement of the click: a first-party `checkout_open` event (cookieless counter, or the consent-gated `CheckoutIntent` that already exists) per block position. Purchases are visible only in the Hotmart dashboard until PV-D5 is decided.

## 4. Perceived speed

Why it matters here: social in-app browsers on mid-range Android; Vodafone's controlled A/B (identical pages) saw +8% sales for a 31% better LCP ([07] section 5, primary case study); no study isolates INP.

| Action | Effect (to verify by trace and Lighthouse) | Milestone |
|---|---|---|
| Consent-gated lazy pixel; zero third-party requests before consent | Removes 209 KB and about 2.1 s of main thread from first paint | M3 (ships at M7) |
| WebGL scene only on fine pointer, at least 1024 px, after first interaction | Removes the 177.6 KB scene closure and its mount from phones (suspected main cause of product-page TBT 6.6 s) | M3 |
| JS cuts: CSS scroll-snap carousel instead of `embla-carousel` (7 KB gz), lazy zoom dialog, drop unused Base UI parts from landing routes | Product page 174.5 to at most 170 KB gz | M3 |
| Hero image stays a preloaded AVIF at most 150 KB; one preload only | LCP element discovered early (already implemented) | keep |
| Cloudflare beacon off or documented; `/_next/static` cached for a year | Fewer third parties, repeat-visit speed | M3 (PV-D9) |
| Production-config Lighthouse lane and nightly live lane | Measures what users get; ends the "100 in docs, 31 live" gap | M2 |
| Field: RUM `web-vitals/attribution` with LoAF attribution after the VPS exists; CrUX when traffic allows | Field p75 LCP, INP, CLS | MV |

Targets (mobile lab, 4G sim, 4x CPU): LCP at most 2.0 s, TBT at most 200 ms, CLS at most 0.05, INP at most 150 ms; field p75 targets LCP 2.5 s, INP 200 ms, CLS 0.1 ([13] section 2.6). Test in the real Instagram in-app browser once per release (human or device-cloud step).

## 5. SEO

State: Product with one Offer and BreadcrumbList on the kit page, Organization on the hub, canonical self URLs, `robots.txt` allowing all with noindex pages crawlable, sitemap of 3 URLs (`/`, `/grafismo-fonetico/`, `/soporte/`, which matches the indexable route table), `lang="es"`, `og:locale es_LA`.

| Item | Spec |
|---|---|
| Product JSON-LD | `Product`: name, description, image (absolute), sku, brand Organization, `offers`: `Offer` with `price` (formatted from config), `priceCurrency: "USD"`, `availability: InStock`, `url`, `seller` (Organization). Digital good: no shipping or return-policy properties; no `AggregateRating` or `Review` unless genuine visible first-party reviews exist (Google spam and FTC risk). Add `Product.category` only if verified in Google's current docs (July 2026 coverage is a secondary source) |
| Other JSON-LD | `Organization` (name, url, logo, `sameAs` from `site.social`), `WebSite` (name, url; no sitelinks search box), `BreadcrumbList` per page. Built in `src/views/seo/` and validated by a unit test against `schema-dts` types and a JSON Schema |
| JSON-LD safety | One serializer `jsonLd()` that escapes `<` as `<` (Next.js docs: `JSON.stringify` is not XSS-safe); the only `dangerouslySetInnerHTML` outside the offer-mode script |
| Metadata | Titles at most 60 characters, descriptions 150-160, unique per route, one `h1`, `alternates.canonical`, OG and Twitter images per page with the real sheet and no price; test over every indexable route |
| Sitemap | `lastModified` from the content date of each route (a constant in `config/` bumped by the author, or git date at build), not `new Date()`; include new content pages when they ship; submit to Google Search Console and Bing Webmaster Tools (owner) |
| FAQ | Keep the on-page FAQ for users; **no `FAQPage` markup** (D-08: rich results limited in 2023 and reportedly removed in 2026, unverified; no benefit) |
| llms.txt and "AI schema" | Not done (D-09) |
| Content cluster (proposal, owner approves) | Four to six pages answering real queries from the product's own expertise, each with original content and a calm link to the kit: for example "Fichas de grafismo para niños de 4 años", "Cómo empezar con sílabas en casa", "Cuántas hojas imprimir por semana". Copy is written from `docs/content-model.md` sources only; no outcome promises; M5, after the design system exists |
| Redirects and canonical host | Apex canonical; `www` to apex in one hop (standalone: host or Cloudflare rule), trailing slash everywhere; the old Montessori shop paths return 410 (existing) |
| Language and locale | Single Spanish locale: `<html lang="es">`, `og:locale es_LA`, one canonical URL per page, **no hreflang** while there are no regional variants (Spain and Latin America share the same pages, prices through Hotmart). Queries target both markets by avoiding regionalisms in titles and headings ("ordenador" versus "computadora", "coger", "vosotros" and voseo are all excluded; test in content invariants). If Spain later gets different content, price or legal text, add `es-ES` and `es-419` alternates with `x-default` and re-test |
| Hostinger | `build-info.json` check stays; headers and redirects from `config/edge-rules.json` |

Measured SEO (Lighthouse): 92 on the two indexable pages; 58-61 on noindex pages by design.

## 6. Privacy-respecting analytics with consent, and the purchase-tracking gap

### 6.1 Decision PV-D1 (resolved: opt-in, DR-01)

Current: `DEFAULT_CHOICE` grants `analytics` and `marketing` before any choice; the pixel loads at first paint; the banner is the withdrawal control. `docs/tracking.md` states this does not meet prior-consent criteria (AEPD 2024, ePrivacy) and lists Chile's Ley 21.719 as applying from 2026-12-01. Recommendation: switch to opt-in.

| Option | Pros | Cons |
|---|---|---|
| **A. Opt-in (recommended)** | Complies with prior-consent rules; removes the pixel from first paint (speed); simplest legal story across AR, MX, CL and EU visitors | Fewer site events and a smaller custom audience; Meta optimization signal reduced (Hotmart's own checkout events stay complete) |
| B. Keep opt-out | Maximum event volume | Legal exposure stated by the repo's own doc; slow first paint |
| C. Opt-out with deferred pixel (idle or first interaction) | Fixes speed only | Still processes before consent |

Spain and the EU settle the choice: GDPR and the ePrivacy rule require prior consent, and the site already targets Spanish buyers, so opt-out is not defensible there (the owner fact of 2026-11-09 that Spain is a possible market is why PV-D1 is the only recommended option). Implementation (tasks M3-C1..C5, early in M3 on `develop`): `DEFAULT_CHOICE` all false; bump `CONSENT_VERSION` to 3 (re-prompts everyone once); banner copy per `design-playbook.md` section 10 with three equal buttons; `TrackingScripts` loads `fbevents.js` only after a stored grant and after `requestIdleCallback`; CAPI relay drops everything without a grant (already true after rejection); update `/cookies/` and `/privacidad/`; flip the encoded tests (`tests/browser/tracking.spec.ts` currently asserts the pixel runs by default); add the invariant test "zero third-party requests before an explicit grant" on every route. Delivery: task branch to `develop`, and it reaches production at M7 with the refactor: no hotfix (DR-01, D-13); the owner accepts the interim legal risk.

### 6.2 Target measurement stack

| Layer | Tool | Consent class | Events |
|---|---|---|---|
| Traffic truth | Cookieless counter (PV-D4: Umami or Plausible; CSP already allows `cloud.umami.is`) | none claimed (contested whether "no banner needed" holds in every jurisdiction: get counsel, [07] section 9) | pageview, `cta_click` (block position), `checkout_open`, `sample_download`, `faq_open`, `scroll_75`, `color_scheme_dark` and `session_hour_bucket` (for the dark-mode trigger) |
| Ads optimization | Meta Pixel plus CAPI relay | marketing, prior opt-in | `PageView`, `ViewContent`, `PequeversoProductInterest`, `PequeversoAffiliateClick`, `CheckoutIntent` (existing taxonomy, UUID event ids, deduplicated) |
| In-house aggregates | `features/site-analytics` to the assistant API | explicit stored analytics grant | closed section-view and click-cell schema (existing contract); default off until MV |
| Purchases | Hotmart dashboard and Hotmart's native pixel integration | Hotmart's | `InitiateCheckout`, `Purchase` (never emitted by the site: forbidden events guard) |

Event taxonomy is one table in `docs/reference/analytics-events.md` with owner, schema, consent class and test; new events such as `web-vital` need a handoff to the API repo first (ecosystem 18.1).

### 6.3 The purchase-tracking gap

The purchase happens on Hotmart's origin, so the site cannot see it. Options ([07] section 9), ranked:

1. **Now:** Hotmart native pixel integration ("Sales made" = Purchase, Web plus API) as configured per `docs/tracking.md`; attribution by `sck` and UTMs in the Hotmart dashboard. Limit: consent handling is Hotmart's.
2. **MV (PV-D5):** Hotmart webhook on approved purchase to a small server that calls CAPI `Purchase` with `event_id` equal to the Hotmart transaction id and hashed email, only for buyers who consented at purchase time. Main compliance risk: proving consent at checkout. Needs the VPS or the Node relay on Hostinger and legal review; not started before PV-D8.
3. **Proxy optimization:** with few sales, optimize ad campaigns on `ViewContent` or `CheckoutIntent` instead of `Purchase` (Meta needs event volume).
Success measure while the gap exists: `checkout_open` rate per block and per traffic source (UTM), and Hotmart dashboard purchases by `sck`; judge changes by before and after with annotations, controlling for the traffic mix.

### 6.4 Experiments (low traffic rules)

Ship best practice without testing; use sequential before/after with annotations; one bold test at a time (headline, hero and CTA wording as one bundle) through separate UTM URLs, judged on `checkout_open` rate and purchases over at least four weeks; no multivariate; qualitative sessions (five parents) before any test. Backlog by expected impact and effort: (1) pixel and scene removal from first paint (M3, not a test), (2) publish the withdrawal-by-email process (PV-D2, OD-50: the guarantee stays 7 days, nothing longer is promised), (3) concrete hub lead, (4) buy box facts, (5) sample sheet, (6) guarantee block before the offer, (7) hero image variants (bundle test, M6+).

## 7. Assistant messaging rules (for activation, PV-D12)

Disabled today; compiled out of publishable builds. Rules for any future activation (research [07] section 6; Baymard 2026: people prefer AI for feature comparison and stock questions, two thirds want a human for billing and damage problems):

1. Disclose at first message and in the panel header: automatic assistant, not a person.
2. Pre-sale scope only: contents, ages, format, printing, guarantee text; for payments, refunds or failed deliveries hand off to a human (email) in one tap; no forced bot loops.
3. Facts only from tool results of the same sources as the page: price, guarantee, refund, links; never from model memory (Moffatt v. Air Canada, 2024: the company answered for the bot's wrong policy). Guarded in the API ("grounding in code").
4. The affiliate course: disclosure on every card, price shown as "consulta el precio" when unknown, no nutrition, allergy or developmental advice, link to professional guidance.
5. Never address children, never collect child data, no PII storage; conversation logs only with consent; privacy section written first (PV-D8).
6. Never obscure or replace the checkout CTA; no checkout, cart or payment in chat (existing non-negotiable).
7. Measurement: holdout (10-20% never see it) plus resolution rate, handoff rate and wrong-answer rate on a labelled sample; assume selection bias in assisted-session conversion ([07] section 6).
8. Activation gate: API golden set 100% (ecosystem section 12), refusal behaviour passed, live run under the owner's spend cap, VPS online; owner authorization recorded in `docs/assistant-activation.md`.

## 8. Legal items for Argentina, Mexico and Chile

The seller is an Argentine natural person selling downloadable PDFs through Hotmart (merchant of record) to buyers mostly in Latin America (`docs/legal-checklist.md`). Items below combine the repo's checklist (read 2026-09-24) and [07] section 10 (secondary sources, not verified at primary sources unless marked). Owner and counsel decide (PV-D8); personal data of the seller stays out of this plan (see `content/es/legal/seller.ts`).

| Country | Item | Status and plan |
|---|---|---|
| AR | "Botón de arrepentimiento" visible on the first access (Disposición 954/2025 art. 1) | The second keyboard stop on the home page is the link "Botón de arrepentimiento" (audit keyboard scan), so the checklist's owner action 1 appears done on the live site; verify on every route and keep a test |
| AR | Revocation 10 días corridos versus the 7-day Hotmart guarantee; CCyC 1116 b digital-file exception and Ley 24.240 art. 34 interaction unsettled | Not a Hotmart defect: the 10-day right is honored by email (buyer writes to support, owner refunds manually) and published with the process; the 24 h request code applies |
| AR | Request code within 24 h for withdrawal requests (art. 5) | Operational: owner answers within 24 h with a code (`ARR-AAAAMMDD-NN` example in the checklist) |
| AR | Database registration with AAIP (Ley 25.326 art. 21) | Owner action; needed before collecting emails (sample opt-in) |
| AR | Data Fiscal (RG AFIP 4042/2017), prices in pesos plus "precio sin impuestos nacionales" (Res. SIyC 4/2025) | Accountant question; site shows a USD reference plus local-currency note |
| AR | Minors and ads: current protection from Ley 25.326, 26.061 and the Civil Code; bills on under-14 targeting pending (status unverified) | Audience for ads is parents; never target minors |
| MX | New LFPDPPP in force 21 March 2025: privacy notice (aviso de privacidad) content and purposes separated; re-consent for new purposes | Privacy notice in Spanish separating necessary processing from marketing measurement (opt-in satisfies the separation) |
| MX | LFPC art. 76 Bis digital subscriptions (December 2025) | Not applicable to a one-time kit; no subscriptions |
| MX | Withdrawal rights for digital goods | Not found in sources; `consumer-rights.ts` keeps authority link only; counsel |
| CL | Ley 19.496 art. 3 bis b (10-day retracto, as amended by Ley 21.398); whether downloadable digital content is excluded is unconfirmed | State the policy before purchase: the 10-day retracto is requested by email and refunded manually (PV-D2); the 7-day Hotmart guarantee stays the automatic path |
| CL | **Ley 21.719 (data protection) from 2026-12-01**; a postponement bill passed first reading in the Senate on 2026-10-28 (sources disagree on a new date; see `sources.md`, row "Chile Ley 21.719"); minors' data treated as special (details not verified) | Plan as in force on 2026-12-01: opt-in consent (PV-D1), updated privacy policy naming controller, purposes, rights and contact, no data of minors collected, data inventory in `docs/reference/data-inventory.md`, retention schedule. Re-check the bill status weekly until 2026-11-27 |
| All | Affiliate disclosure at the point of the link, no health claims on infant nutrition | Done on home and legal pages (2026-10-12); keep tests |
| ES / EU | GDPR and ePrivacy: prior, granular, withdrawable consent for marketing cookies (in Spain, LSSI art. 22.2 and AEPD cookie criteria); equal Aceptar and Rechazar; privacy notice naming controller (an Argentine natural person, a third-country controller), purposes, legal basis, international transfers (Argentina has an EU adequacy decision; Meta and Hotmart transfers need their own mechanism: counsel), rights and contact; consider whether an EU representative (GDPR art. 27) is required for a controller outside the EU targeting EU residents | Opt-in (PV-D1) satisfies the consent part; the rest goes into PV-D8. `docs/legal-checklist.md` already lists the Spanish anchoring as removed on 2026-09-24 and EU only as a buyer market: keep that and add the art. 27 question. Research from knowledge, not re-verified in this session |
| ES / EU | Consumer law for distance sales: 14-day withdrawal; digital content loses it only with the buyer's express consent and acknowledgement given before delivery (Directive 2011/83/EU art. 16 m, already in the per-country table); in Spain RDL 1/2007 arts. 102-104 | Hotmart's checkout carries the consent conditions (existing checklist caveat); the 14-day EU window is honored by email and refunded manually outside Hotmart's 7-day automatic window (PV-D2); verify the checkout wording in PV-D10 with a Spanish buyer profile |
| ES / EU | European Accessibility Act (Directive (EU) 2019/882, applying since 2025-06-28 to e-commerce services offered to EU consumers; Spain transposed it nationally, details not verified) | The Act exempts **microenterprises** providing services (fewer than 10 persons and turnover or balance sheet at or below EUR 2 million); the seller is a one-person business, so the exemption likely applies, but whether it applies to a third-country seller targeting the EU is a counsel question. The plan meets WCAG 2.2 AA anyway (EN 301 549 maps to it) and publishes the accessibility statement (M3), so the exposure is low either way |
| All | Cookies: `/cookies/` must list every third party including the Cloudflare beacon if it stays | PV-D9 |
| All | EU buyers: 14-day withdrawal and art. 16 m digital-content conditions depend on Hotmart checkout | Existing per-country table; Hotmart's guarantee applies regardless |
| All | Accessibility statement page (ecosystem 2.4) | Add `/accesibilidad/` in M3: conformance target WCAG 2.2 AA, known limitations (the Hotmart widget), contact |

## 9. CRO axes, evidence and the evaluator procedure

| Axis | Pass condition (95) | Evidence |
|---|---|---|
| C1 Value proposition above the fold | Four-question test passes at 320 x 568 and 390 x 844 on hub and kit; no banner over price or CTA | Screenshots, evaluator answers, optional parent test |
| C2 Trust signals (real only) | Honest proof inventory complete (sample, creator, guarantee, Hotmart line, update date); invariants test green; zero fabricated proof | Invariants test, evaluator |
| C3 Purchase path | Price, currency, guarantee, format visible before the first CTA; same label; click feedback at most 100 ms; per-block `sck`; PV-D10 screenshots exist | E2E, unit tests, PV-D10 set |
| C4 Perceived speed | Lab gates (LCP at most 2.0 s, TBT at most 200 ms, CLS at most 0.05, INP at most 150 ms) on production-config build and live; field p75 when available | Lighthouse JSON, RUM |
| C5 Assistant messaging | Disabled state has zero trace; activation checklist file complete and unmet items listed | `assistant-disabled` spec, checklist |
| C6 SEO | Schema validation, metadata, sitemap, canonical tests green; Search Console submitted; no FAQPage markup, no fabricated ratings | Unit tests, owner screenshot |
| C7 Privacy-respecting analytics | Zero third-party requests before consent on every route; consent flow tests; privacy and cookie pages match behaviour; event taxonomy documented | Playwright network assertion, doc check |

The evaluator agent (sees repo, evidence and this rubric, never the planner's reasoning) scores C1, C2, C3, C6 each release and records links in `progress.md`.
