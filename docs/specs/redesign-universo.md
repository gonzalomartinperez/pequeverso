# Spec: redesign "Universo evolucionado" (whole site)

**Central idea:** a Latin American parent landing from a social ad understands in five seconds that
Grafismo Fonético is a real, orderly printable kit they can start today (one sheet, ten minutes),
sees the actual pages, feels the warmth of doing it together, and buys with confidence.
**Primary action:** the Hotmart checkout (`CheckoutLink`) on the landing; the product page link
(`ProductInterestLink`) on the hub; the Hotmart widget on post-purchase pages.
**Routes:** every route (`/`, `/grafismo-fonetico/`, `/imprime-y-juega/` + `?downsell=1`,
`/grafismo-fonetico/gracias/`, `/soporte/`, legal pages, 404).

## 1. Model and message (what the design has to serve)

| Fact | Consequence for the design |
|---|---|
| Low-ticket (US$14,99), one payment, Hotmart checkout in a new tab, 7-day guarantee | The price must feel light and safe: one clear coral action, reassurance next to every CTA, no "sales page" noise. |
| Traffic: Meta/TikTok ads and `@somospequeverso` bios → **mobile first** (390 px) | The first mobile viewport carries promise + proof (real page) + CTA. Motion must be cheap on mid-range Android. |
| Buyer: parent (mostly mothers 28–38) of a 3–7 year old, neutral Spanish, all LATAM + US Hispanics | Warm, human, "we do this together at the table"; families that look like them (ChatGPT image set). |
| Product proof = real pages (414 pp, 9 PDF) — no testimonials, no results claims | Proof is **showing** the material: page walls, zoom, flip, the Mira·Di·Traza·Une mechanism made tangible. |
| Brand: "pequeño universo" — navy sky, gold star, turquoise orbit, cream paper | Keep the universe as the emotional frame (hero, closing, footer); the body lives on light gradients. |
| Post-purchase: upsell/downsell decided by the Hotmart widget | Same visual language, calmer; the widget stays the only decision. |

**Message hierarchy (every page):** 1) Qué es y para quién → 2) Cómo se usa (10 min, 4 gestos) →
3) Mirá las páginas reales → 4) Qué recibís (principal + 8 bonos) → 5) Precio único y garantía →
6) Dudas → 7) Empezá hoy.

## 2. Design principles

1. **Light, airy, premium.** Gradient paper surfaces (cream → white, celeste → white, soft blue
   → white) instead of flat colour bands and waves; generous whitespace; larger radii.
2. **The universe frames, the paper informs.** Navy only for hero, method band and closing; all
   reading happens on light gradients.
3. **Show, don't claim.** Every section has a real page, a real cover or an interactive demo.
4. **Motion with meaning.** Things float like planets, cards orbit, syllables join into words.
   Everything is transform/opacity, scroll-driven where possible, and fully static under
   reduced motion.
5. **One coral action.** Coral stays exclusive to the purchase CTA and price.

## 3. Visual language

### Colour and gradients (new tokens in `globals.css`)

| Token | Recipe | Use |
|---|---|---|
| `--pv-celeste` | `#dcefff` | celeste stop for sky gradients |
| `--pv-blue-soft` | `#cfe0ff` | soft blue stop |
| `--pv-peach` | `#ffe9dc` | warm stop for cream gradients |
| `bg-aurora-cream` | radial peach + lemon glows over cream → white | problem, audience, FAQ |
| `bg-aurora-sky` | radial celeste + turquoise glows over white → celeste | pages, includes |
| `bg-aurora-blue` | soft blue → white with a navy-tinted glow | offer, videos |
| `sky-hero` (kept) + aurora glow | navy universe with turquoise/gold nebula glows | hero, method, closing |
| `text-gradient` | navy → teal clip text | one accent phrase per heading |
| `border-glow` | animated conic gradient border (gold → turquoise → coral) | the offer card only |

Bands melt into each other: each light band starts and ends on the colour of its neighbour
(no waves on light→light joints; a single soft curved mask where navy meets paper).

### Type
Fraunces (display) and Nunito Sans stay. Display scales up (`--pv-text-display` 38 → 72 px,
`--pv-text-h2` 32 → 52 px), tighter tracking (-0.02em) on display, eyebrow chips become pills with
a dot. Numbers (price, counters) use tabular figures.

### Shape and depth
Radius: md 12, lg 20, xl 28, 2xl 36. Shadows are layered and navy-tinted
(`--pv-shadow-float`: close contact + wide ambient). Glass surface (`glass`): white 72 % +
`backdrop-filter: blur(16px) saturate(1.4)` + 1 px white border, with a solid fallback.

## 4. Motion system (additions to `src/motion`)

| Primitive | What it does | Tech | Reduced motion |
|---|---|---|---|
| `Float` (CSS `.pv-float`) | slow vertical bob with per-item phase | CSS keyframes | static |
| `Marquee` | infinite horizontal strip (chips, page wall); pauses on hover/focus and via a button | CSS transform loop, duplicated list `aria-hidden` | static wrapped row |
| `ScrollProgress` | thin gradient bar under the header | `animation-timeline: scroll()` | hidden |
| `Spotlight` card | pointer-following glow on bento cards | CSS vars from a tiny client island | no glow |
| `MagneticButton` | CTA drifts ≤ 6 px toward the pointer; shine sweep on hover | client island around the existing link | plain button |
| `SyllablePlayground` | interactive demo: tap GA + TO → the word GATO appears, dotted word traces itself (SVG stroke) and the real page slides in | client island, buttons + `aria-live` | instant swap |
| `PageWall` | two rows of real pages drifting in opposite directions | `Marquee` | static grid |
| `OrbitCards` | bonus covers orbit/fan around the main PDF on scroll | scroll-driven CSS | static fan |
| `Reveal` (kept) | `data-reveal` with blur-in variant `data-reveal="blur"` | view timeline | visible |
| Existing 3D scene | stays in the hero only (budgeted) | three + gsap lazy | static layers |

## 5. Shell components

- **Header → floating glass pill.** Detached from the edges (12 px top, page-container width),
  glass surface, logo + anchors + CTA; condenses (smaller padding, stronger shadow) after 24 px of
  scroll (scroll-driven, no JS). Mobile: logo, CTA, menu button. Scroll progress bar underneath.
- **Mobile nav sheet:** full-height glass sheet with large anchors and the CTA.
- **Topbar:** becomes a slim marquee of the three facts (static under reduced motion).
- **Sticky buy bar (mobile):** floating glass pill at the bottom with price + CTA.
- **Footer:** navy universe with a large outlined wordmark "pequeverso", columns kept, disclaimer kept.

## 6. Pages

### 6.1 `/grafismo-fonetico/` (principal landing)

| # | Section | Purpose | Copy | Media now → ChatGPT slot | Behaviour |
|---|---|---|---|---|---|
| 1 | Hero (navy universe → cream curve) | promise + age selector + CTA + price card | `copy.hero` | age-aware page stack + floating syllable chips → **T01** family cut-out in front of a glowing planet | `#hero`, `#comprar`, CTA `hero`, `hero-card`; 3D scene kept |
| 2 | Fact marquee | 9 PDF · 414 páginas · imprimible · 3–7 años · 10 min | `copy.topbar` + facts | — | Marquee |
| 3 | Qué recibes (bento) | principal + 8 bonos as a bento of covers, counters | `copy.included` | `gf.card.*` → **T04** kit + bonos | `#incluye`, Spotlight + tilt |
| 4 | El problema (aurora-cream) | empathy + orderly solution | `copy.problem`, `copy.benefits` | `gf.scene.mesa` → **S01** | bento of 4 benefits, callout |
| 5 | Método (navy) | Mira · Di · Traza · Une + interactive playground | `copy.method`, `copy.credibility` | real GATO page | `#metodo`, SyllablePlayground |
| 6 | Páginas reales (aurora-sky) | proof: carousel + zoom, page wall | `copy.pages` | `gf.page.*` | `#paginas`, gallery kept (zoom dialog) |
| 7 | Videos (aurora-blue) | illustrative practice | `copy.videos` | `video.gf.*` | kept |
| 8 | Oferta (glow card) | price, checks, CTA | `copy.midOffer`, `copy.offer` | **T08** mamá señalando | `#oferta`, CTA `oferta` |
| 9 | Para quién (aurora-cream) | fit / no fit | `copy.audience` | **S06** | — |
| 10 | FAQ (aurora-sky) | objections | `copy.faq` | — | `#preguntas` |
| 11 | Cierre (navy) | final CTA | `copy.finalOffer` | **T09** niño celebrando | `#oferta-final`, CTA `final` |
| — | Sticky bar | mobile buy | `copy.sticky` | — | CTA `sticky` |

### 6.2 `/` (hub)
Hero (navy, family T02 later / page stack now, product glass card), marquee, "Empieza por aquí"
bento, flip previews → page wall, method band with the playground, values bento, closing with
social links. Links go to the product page (never coral).

### 6.3 `/imprime-y-juega/` (upsell / downsell)
Same shell; hero on aurora-sky with the pack visual and counters; decision band stays navy with
the widget in a glass card; resources as bento; page wall; moments bento; FAQ; close. Offer-mode
script, `#hotmart-sales-funnel`, `#gfp-decision` and all ids unchanged.

### 6.4 `/grafismo-fonetico/gracias/`, `/soporte/`, legal, 404
Aurora surfaces, glass cards, new header/footer; legal keeps its prose measure and index.

## 7. ChatGPT image slots (integration later through `tools/media`)

| Code | Slot |
|---|---|
| T01 | landing hero foreground |
| T02 | hub hero foreground / mobile hero |
| T03 | hub "páginas reales" header art |
| T04 | landing "Qué recibes" lead visual |
| T05 | gracias page ("descargá e imprimí") |
| T06 | problem section accent |
| T07 | method band (tarjetas) |
| T08 | offer card side |
| T09 | closing band |
| T10 | floating elements (hero parallax, section accents) |
| S01–S10 | problem, how-it-works, routine, audience, upsell hero, moments, soporte, gracias, FAQ side, OG |

Until the files exist, each slot renders the current real media or nothing; no placeholder art ships.

## 8. Acceptance

- Widths 1440/1280/1024/768/430/390/360 (+320): no horizontal overflow; header CTA in the first
  mobile viewport; no fixed layer covers a checkout CTA (`responsive.spec.ts`).
- Every existing id, `data-position`, `data-testid` and accessible name the e2e specs use is kept.
- Keyboard path to the CTA; focus visible on glass (navy ring) and on navy (gold ring); targets ≥ 44 px.
- Contrast from tokens (unit test extended for new gradient stops under text).
- Reduced motion: marquees static, playground instant, no float/tilt/spotlight.
- CLS ≤ 0.1, LCP ≤ 2.5 s lab; route JS within budget (new islands are small); HTML/CSS budgets
  re-baselined at measured + 10 % (recorded in ADR-0006 addendum).
- Visual baselines regenerated by the nightly `update_snapshots` run after merge.

## Open decisions

- None blocking. ChatGPT images: owner generates with `pequeverso-prompt-chatgpt.txt`; they are
  AI-illustrative and will be recorded as such in `media/manifest.json`.
