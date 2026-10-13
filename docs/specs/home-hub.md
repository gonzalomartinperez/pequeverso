# Spec: home as the hub of two products

**Central idea:** a parent who lands on pequeverso.com (mostly on a phone, from a social post or
bio) understands in the first viewport that Pequeverso accompanies each stage of the family. They
pick the door that matches today's need: «Aprender a leer · 3 a 7 años» (Grafismo Fonético, our
printable kit) or «Empezar a comer · 6 a 12 meses» (Guía de Alimentación para Bebés, a
third-party course recommended as a Hotmart affiliate). Both products get the same weight from
the hero to the close.
**Primary action:** one per product, with the same visual weight. `ProductInterestLink` goes to
`/grafismo-fonetico/` and `AffiliateLink` goes to `/alimentacion-bebe/?src=sitio-home`. Neither
product is bought directly from the home.
**Route:** `/` · **robots:** index · **canonical:** self

Owner requests (2026-10-13):
- «equiparar el home para que esté nivelado entre los dos productos desde el inicio al final»
- «los botones del header y demás ya no deben apuntar a un solo producto»
- «deben quedar ambos espectaculares y nivelados según las necesidades de cada cliente»
- «poné un desplegable de productos»
- «mejorar al máximo todo lo relacionado a animaciones y rendimiento»
- No new measurement in this change («el tracking … es una mejora a futuro»).

The design also follows the conversion research for multi-product hubs (pequeverso-marketing
`research/2026-10-13-home-hub-conversion.md`). When the research and an owner request disagree,
the owner's request wins (the «Productos» dropdown stays).

## Decisions

1. **Self-selection first.** The hero is a need selector: a short headline and two doors of the same
   size and weight. A door's label states the task and the age, never an identity. Each door is one
   `<a href="#leer">` / `<a href="#bebe">` that works without JavaScript and inside in-app
   browsers. It holds the real product photo (the kit's pages, the scene of a mother feeding her
   baby), the stage chip, the format («PDF para imprimir», «Curso en video») and a single visual
   action. On phones the doors sit side by side, so both are inside the first viewport.
2. **Buttons.** Coral (`primary`) stays reserved for the direct purchase of Grafismo Fonético on its
   landing. On the home every product action is the same navy `secondary` pill (`LINK_NAVY`), or the
   same white pill (`LINK_WHITE`) in the navy close. Labels are verb + destination: «Quiero el kit ·
   US$14,99» (the price comes from the registry) and «Ver la guía en Hotmart». Under each action
   goes one line of reassurance: «Pago único · 7 días de garantía · se cobra en tu moneda local» for
   the kit and «Garantía de 7 días de Hotmart · se cobra en tu moneda local» for the course.
   Secondary actions are text links («Ver qué incluye», «Ver cómo funciona»).
3. **Header and navigation.**
   - *«Productos» dropdown (every width):* a navy pill in the header CTA slot opens a mega-menu with
     one rich card per need: thumbnail, stage, task, a line about the need, product and format, and
     «Recomendado» plus the short disclosure on the course. Cards link to `/#leer` and `/#bebe`.
     The menu is built on the native Popover API: it ships no JavaScript to open, it closes on
     Escape or an outside click, the focus order runs from the trigger into the panel, and it sits
     in the top layer with no layout shift. The open/close transition is CSS (`.pv-popover`,
     `@starting-style`) with staggered cards, and it simply appears under reduced motion. Base UI
     `NavigationMenu` was not used because it would add a client island to every page for
     behaviour the platform already provides.
   - *Text anchors (from lg):* «Aprender a leer», «Empezar a comer» and «Preguntas». The anchor of the
     chapter in view is marked `aria-current="location"`.
   - *Auto-hide (home only):* the header slides away while the visitor reads down past the hero and
     returns on any scroll up (transform, 340 ms). It never hides while it holds focus or while its
     menu is open.
   - *Mobile menu:* two large tappable product cards first, then the remaining anchors and support.
   - *Pages:* the menu appears on the home (the hub). Support, legal and 404 pages keep their
     neutral header (no product there); the 404 page offers both products in its body. Next.js
     embeds the 404 tree in every page's payload, so a menu there would add ~2.5 KB gzip of HTML to
     every route.
     The landing, offer and thank-you pages keep their own `nav`/`cta`, because the visitor has
     already chosen. The
     landing's coral checkout and the Hotmart funnel (`docs/hotmart-funnel.md`) are unchanged.
   - *Footer (every page):* the «Productos» column lists the kit (landing, «Qué incluye») and the
     course, which links to `/#bebe`, where the disclosure sits next to the button. The footer never
     links straight to the affiliate redirect.
   - *404:* its body links to the course chapter next to the kit.
4. **Contextual sticky bar (home, below lg).** It shows the two doors before a chapter, the kit
   with its price and link inside `#leer`, and the course with «Enlace de afiliado · a ti no te
   cuesta más» and its link inside `#bebe`. It is hidden over the hero, the close, the footer and
   any open dialog. It is a single small island (`HubStickyBar`) that also drives the header
   auto-hide and the active anchor.
5. **Affiliate rules.** The disclosure is visible wherever the course appears: under the hero
   doors, on the menu cards, in the full mandatory text in `#bebe` (linked to
   `/aviso-legal/#afiliados`), in the sticky bar and on the closing card. There is no price, no
   reviews and no health or results promises; one FAQ answer states that the course does not
   replace the paediatrician. Links use `rel="sponsored noopener"` and open a new tab.
6. **Measurement unchanged.** The existing events keep their parameters:
   `PequeversoProductInterest` and `PequeversoAffiliateClick` with `product` and `cta_position`
   (`story`, `story-includes`, `sticky`, `closing` for the kit; `home`, `sticky`, `closing` for the
   course). The affiliate `src` stays `sitio-home` on every link. No new events and no `src`/`sck`
   per placement (a future improvement, owner decision).
7. **Copy by need.** Each chapter opens with the family's pain and then its desire. Reading: «Que
   aprenda a leer, sin presión» (one sheet and ten minutes, no classroom at home). First meals: «Sus
   primeras comidas, sin miedo ni horas en la cocina» (when and how to start, quantities, a 4-week
   menu, recipes for the whole family). Facts come from `src/products/grafismo-fonetico.ts`,
   `config/commerce.ts` and `config/affiliates.ts`. Copy lives in `content/es/home.ts` (page) and
   `content/es/hub.ts` (labels shared by doors, menus, sticky bar, footer and 404). There are no
   testimonials and no invented numbers.

## Sections (in order)

| # | Section | Purpose | Copy source | Media | Behaviour |
|---|---|---|---|---|---|
| 1 | `#hero` + `#elige` | Promise and need selector with two equal doors joined by a dashed orbit and the gold star | `home.hero`, `hub.*` | `gf.hero` (priority, the one preloaded image), `bebe.scene.primera-papilla` (eager, never preloaded) | Doors → `#leer` / `#bebe`; the course door is described by the disclosure under the doors |
| 2 | trust strip | Hotmart payment · 7-day guarantee (shown as a number only when both products share it) · digital access · local currency | `home.trust` | — | Static, staggered reveal |
| 3 | `#leer` (alias `#grafismo-fonetico`) | The kit from the reading need: girl tracing a real page, pain → desire, what you get, product box (PDF/pages/bundle from the registry, price + local-currency note), CTA, note, «Ver qué incluye» | `home.reading` | `gf.cutout.trazo`, `gf.page.07` | `ProductLink position="story"` |
| 4 | `#leer-como` | Mira · Di · Traza · Une and the syllable playground on real pages | `home.method` | `gf.cutout.tarjetas`, real pages | Playground island (unchanged) |
| 5 | `#bebe` (alias `#alimentacion-bebe`) | The course from the first-meals need, the same component mirrored: mother and baby, the course on devices, pain → desire, syllabus from config, product box (format, audience, Hotmart guarantee), CTA, note, full disclosure, «Ver cómo funciona» | `home.affiliate` | `bebe.cutout.mama-brazos`, `bebe.cutout.dispositivos` | `AffiliateLink position="home"`, `data-affiliate-block` |
| 6 | `#bebe-como` | Mira · Organiza · Cocina and the 4-week menu | `home.affiliate.how` | `bebe.cutout.bol`, `bebe.scene.menu` | Static |
| 7 | `#preguntas` | FAQ by product (two columns), then «Para elegir y pagar» | `home.faq` | — | Zero-JS `FAQ` |
| 8 | `#cierre` | The two doors again, now straight to each destination with the same white pill (kit + price; course + disclosure), social profiles | `home.closing`, `hub.*` | `gf.cutout.elementos`, `bebe.cutout.planeta` (decorative, lg) | `ProductLink position="closing"`, `AffiliateLink position="closing"` |

Both chapters render through `ProductStory` + `HowBand`, so they cannot drift in structure or weight.
Only the media side alternates from lg. Removed from the home (still on the landing): the featured
product card, the kit collection bento, the lifestyle banner, the real-pages showcase with the page
wall, and the values bento. Retired media: `gf.life.logro`, `bebe.scene.mama` and
`bebe.scene.mama-vertical`. New media come from the content studio's set with faces (`fondos/03`,
`fondos/07`, `transparentes/t09`, `transparentes/t12`).

## Motion and performance

- Transform/opacity only. Hero entrance uses `data-hero-enter` (the doors use `media`, without an
  opacity fade). Below the fold, `data-reveal` + `--i` stagger. The menu opens with a CSS
  `@starting-style` transition. Cards and doors get hover lift, photo zoom and arrow nudges
  (`motion-safe:`). The sticky bar swaps content with a short rise (`.pv-swap`), and the orbit star
  bobs (`Float`). Under reduced motion everything is still and complete.
- One priority image (`gf.hero`, AVIF/WebP, preloaded, `fetchpriority="high"`); the h1 is the LCP
  candidate on phones. The other door image is eager without a preload. Everything below the fold
  is lazy. Images inside the closed menu are never requested.
- Fewer islands than the old home: no page wall and no flip previews. The sticky bar, header
  behaviour and active anchor share one island.

## Acceptance

- Widths: 1440 / 1280 / 1024 / 768 / 430 / 390 / 360 (+320 reflow), with no horizontal overflow
  (`responsive.spec.ts`) and the 200 % text reflow (`text-zoom.spec.ts`).
- Both doors are inside the first viewport and the same size (`hub.spec.ts`). The anchors `#leer`,
  `#bebe`, `#grafismo-fonetico`, `#alimentacion-bebe` and `#preguntas` work on direct entry, below
  the header.
- The «Productos» menu opens and closes on Escape, has both cards with the right links and the
  disclosure, and is absent on the purchase and post-purchase pages (`hub.spec.ts`).
- Sticky bar modes and disclosure (`hub.spec.ts`). Affiliate link attributes, disclosure, lazy
  images and events (`commerce.spec.ts`). The home has no checkout link and no coral.
- Hub link keeps acquisition params (`commerce.spec.ts`, `position="story"`).
- LCP element is hero text or the preloaded hero image (`lcp.spec.ts`); CLS ≤ 0.1; Lighthouse
  before/after on the home (see the PR).
- `affiliates.test.ts` scans every piece of course copy (chapter, hub labels, closing, course FAQ)
  for forbidden claims.
- Visual baselines (home, and every page through the shared header/footer) are regenerated by the
  nightly `update_snapshots` run on the branch.

## Open decisions

- None blocking. Measurement per placement (`src`/`sck`, a «need selected» event) is a future
  improvement (owner, 2026-10-13).
