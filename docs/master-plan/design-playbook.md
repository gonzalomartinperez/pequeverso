# Design playbook: conversion-first, kid-safe, unmistakably Pequeverso

Repo type: public store site. Built on `research/13-sites-master-uiux.md` section 4 (Pequeverso master design), `research/07-cro-seo-analytics.md` (CRO playbook) and `research/06-ui-ux-design.md` (tokens, motion, accessibility, dark-mode evidence). All Spanish strings are proposals in neutral Latin American Spanish with "tú", signed "Equipo de Pequeverso"; they contain no invented facts: every price, count, age, guarantee or contact is a placeholder `{like_this}` resolved from `config/` at build time, and the owner approves the package (PV-D7). Colour values were computed (OKLCH to sRGB and the WCAG 2 ratio), other numeric values are proposals to verify with the stated test.

## 1. Concept: the paper-cut night sky

Today's identity (navy, planets, orbiting gold star, cream pages, coral only for purchase) is right. The elevation is one idea that touches every component: **everything in the universe is cut paper, and the real printed sheets are the stars.**

| Idea | What it means in the UI | Why it converts |
|---|---|---|
| Layered paper | Planets, cards and sheets sit on 3 depth levels with layered, navy-tinted shadows (never grey); sheet edges show a hairline paper edge (`--paper-edge`) | The buyer sees something tangible they will hold; the real sheet imagery stops looking like a PDF screenshot |
| Real sheets are the heroes | Product imagery is only real renders of the PDF pages, fanned 3 to 6 degrees; illustration is decoration, never product proof | Reduces digital-product doubt ([07] section 3) |
| One sunrise | The page starts in navy night (brand, wonder) and crosses once, at "how it works", into a warm sunrise horizon and cream day (use, calm, price). It is CSS scroll-driven opacity on one gradient layer, with a static final state | Narrative of use: from magic to the kitchen table; the only cinematic moment on the page (choreography rule 1 of [13] 2.3) |
| Warm hand | Hand-drawn gold swoosh (existing) is the only underline, max once per section; corners are generous; one "sticker" button treatment for secondary actions | Playful to the child, calm to the parent |
| Coral is sacred | Coral fills only buttons that buy and the price numerals; nothing else may be coral (lint, section 3.3) | The eye learns the one thing to press |

Not doing: mascots, kid-voice microcopy ("¡Hola amiguito!"), confetti, countdowns, scarcity, autoplay audio, parallax on text, smooth-scroll libraries ([13] 2.1, [07] "do not do").

## 2. Tokens

Source of truth: `design/tokens/pequeverso.tokens.json` (DTCG 2025.10), built by Style Dictionary v5 into `src/shared/tokens/theme.css` (`@theme` primitives, `@theme inline` semantic roles). Three tiers: primitive ramps, semantic roles (shadcn names plus project roles already in `docs/design-system.md`), component tokens only when two variants diverge. The generated CSS has a snapshot test and the existing contrast test (`tests/unit/design-system.test.ts`) reads the JSON.

### 2.1 Colour ramps (OKLCH with hex fallback, computed)

Existing brand values are kept exactly (rows marked "keep"). Ramps add the missing steps so states, tints and shadows are derived, not improvised. White contrast shown for text-on-fill decisions; every step marked `text` passes 4.5:1 on its stated ground.

| Token | OKLCH | Hex | White contrast | Use |
|---|---|---|---|---|
| navy-50 | 0.975 0.012 256 | #f2f7ff | 1.1 | tint ground |
| navy-100 | 0.945 0.026 256 | #e2eeff | 1.2 | tint ground, sky card |
| navy-200 | 0.890 0.054 256 | #c4ddff | 1.4 | hairlines on dusk |
| navy-400 | 0.720 0.092 256 | #7ea7de | 2.5 | decorative |
| navy-600 | 0.520 0.111 256 | #3b6aa8 | 5.5 | links on cream (alternate) |
| navy-700 | 0.430 0.099 256 | #285085 | 8.2 | text |
| **navy (keep)** | 0.318 0.109 256 | #003068 | 12.9 | brand, structure, `--secondary`, `--ring` |
| **navy-deep (keep)** | 0.262 0.089 256 | #00234e | 15.6 | footer, dusk top |
| navy-950 | 0.210 0.065 256 | #021835 | 17.7 | shadow tint source |
| **coral (keep)** | 0.562 0.172 28 | #c64035 | 5.0 | purchase fill (`--primary`) |
| coral-hover (keep) | 0.493 0.157 28 | #a83129 | 6.7 | hover fill |
| **coral-press (new)** | 0.440 0.140 28 | #902822 | 8.4 | pressed fill (proposal verified: 8.36:1 with white) |
| coral-700 | 0.430 0.151 28 | #911e19 | 8.7 | price numerals on light grounds (kids store aims for 7:1) |
| coral-100 | 0.945 0.027 28 | #ffe6e3 | 1.2 | tint behind price chip |
| **teal (keep)** / teal-text | 0.532 0.092 191 / 0.435 0.075 191 | #007d79 / #005e5b | 5.0 / 7.6 | icons / links |
| **gold (keep)** | 0.891 0.165 94 | #ffd840 | n/a (ink 11.9) | accents on navy only, never text on light |
| **cream (keep)** | 0.987 0.012 80 | #fffaf2 | n/a | page ground |
| paper-100 | 0.945 0.009 80 | #f0ece6 | 1.2 | `--paper-edge` ground, dividers |
| paper-600 | 0.520 0.019 80 | #6f685d | 5.5 | secondary text alternative |
| sunrise-100 | 0.945 0.034 60 | #ffe8d7 | 1.2 | horizon top |
| sunrise-200 | 0.890 0.072 60 | #ffd0ab | 1.4 | horizon mid |
| sunrise stop 3 | 0.86 0.11 70 | #fec582 | n/a | horizon glow near the gold |
| sunrise-700 | 0.430 0.101 60 | #774000 | 8.3 | text on sunrise tints |

Computed pair checks (WCAG 2): cream/navy 12.45; navy/gold 9.34; ink/cream 15.9; body/cream 7.67; muted/cream 5.21; coral/cream 4.83 (so coral text on cream is allowed only at large size; use coral-700 for price text); teal-text/cream 7.34; gold/navy-deep 11.2 (focus ring on navy). "Dusk" gradient stops for the night sky: navy-deep `#01234d` to `#17356d` (L 0.34) to a violet `#5e4784` (L 0.45, chroma 0.10) used only in the transition band; every white text on these stops must be at least 7:1 (checked in the contrast test).

Semantic roles are unchanged in name (`--primary`, `--heading`, `--body`, `--link`, `--chip`, ...). **Dark-ready:** every role is declared once as `--role: light-dark(var(--x-light), var(--x-light))` (both arguments equal today), `:root { color-scheme: light }` and `<meta name="color-scheme" content="light">`, so a future night theme is a token change, not a rewrite (section 9).

### 2.2 Shadows (hue follows the surface)

| Token | Value | Use |
|---|---|---|
| `--shadow-paper-1` | `0 1px 0 oklch(0.21 0.065 256 / 8%), 0 2px 6px oklch(0.21 0.065 256 / 10%)` | cards on cream |
| `--shadow-paper-2` | `0 1px 0 oklch(0.21 0.065 256 / 10%), 0 6px 16px oklch(0.21 0.065 256 / 14%), 0 18px 36px oklch(0.21 0.065 256 / 10%)` | floating sheets, buy box |
| `--shadow-coral` | `0 6px 16px oklch(0.562 0.172 28 / 35%)` | primary button (coral-tinted, never black) |
| `--shadow-gold-glow` | `0 0 24px oklch(0.891 0.165 94 / 35%)` | star on navy |
| `--paper-edge` | `inset 0 0 0 1px var(--paper-100)` | sheet imagery frame |

Shadows are painted on a pseudo-element whose **opacity** changes (hover, press) so the animated properties stay transform and opacity.

### 2.3 Type

Fraunces (display: h1, h2, price) and Nunito Sans (UI and body), both self-hosted variable fonts, metric-matched fallbacks (existing). Proposals: body 17 px at 1.6 on phones; price numerals tabular if the shipped Nunito Sans subset exposes `tnum` (verify; otherwise Fraunces lining figures); `font-optical-sizing: auto`; `SOFT 50` and `WONK 0` for Fraunces only if the subset keeps those axes (the `@font-face` declares weight only: check `public/fonts/fraunces-latin-wght-*.woff2` axes first; if they were subset away, re-subset with `opsz` and `SOFT`, an estimated +15-25 KB inside the 100 KB font budget; if over budget, skip). Fluid scale (existing `text-display` 38-72, `text-h2` 32-52, price 38-44) keeps max/min at most 2.5.

### 2.4 Space, radius, motion

4 px unit, 8 px rhythm; radii: pill (actions), 28 px cards, 20 px content, 12 px tiles (existing). Motion tokens follow [13] 2.2 with the existing `--duration-*` names kept as aliases: instant 100, fast 150 (exit), base 220 (enter), slow 320, page 400 (maximum for UI), reveal 480, hero 700 (first paint only); easings `--ease-out (0.23,1,0.32,1)`, `--ease-emphasis (0.05,0.7,0.1,1)`, `--ease-standard (0.2,0,0,1)`, `--ease-exit (0.3,0,0.8,0.15)`, `--ease-spring` as a CSS `linear()`.

## 3. Buttons and controls (all states specified)

Six treatments, one geometry: pill, height 56 default, 44 compact, 64 large, minimum target 44 px (child and parent thumbs), label sentence case, weight 800.

| Treatment | Where | Fill and text | Notes |
|---|---|---|---|
| **Primary (coral)** | Purchase only: "Obtener el kit" | coral gradient (coral to coral-hover), white text 5.0:1 minimum | The only coral control; `.pv-shine` sweep on hover-capable devices; inner highlight `inset 0 1px 0 oklch(1 0 0 / 35%)` |
| **Sticker (new)** | Secondary: "Ver qué incluye", "Descargar la hoja de muestra" | cream fill, 2 px navy border (12.5:1 boundary), navy text | Tactile: hard offset shadow slab |
| **Navy** | Hub doors, non-purchase actions on light | navy fill, white text 12.9:1 | |
| **Ghost** | Tertiary | transparent, navy text | |
| **Inverse** | On navy bands | white fill, navy text | gold focus ring |
| **Link** | Inline | teal-text, underline offset 3 px | visited not styled |

### 3.1 State matrix (every treatment, every state)

| State | Primary (coral) | Sticker | Navy / Ghost / Inverse |
|---|---|---|---|
| Default | gradient, `--shadow-coral` layer opacity 1 | face on slab (slab 3 px below, navy) | flat, `--shadow-paper-1` on navy |
| Hover (only `@media (hover:hover) and (pointer:fine)`) | face to coral-hover, `translateY(-2px)`, shine sweep 600 ms once, shadow layer opacity 1 to 1.4 equivalent via a second stacked layer | face `translateY(-1px)` | fill shifts one ramp step, 150 ms |
| Focus-visible | 3 px navy ring with 2 px cream offset (gold on navy), never clipped, never covered by sticky bar (`scroll-padding-bottom` equals bar height) | same | same |
| Active (pressed), within 100 ms of pointerdown | face coral-press, `translateY(1px) scale(0.97)`, shadow layer opacity 0.5 | face `translateY(2px)`; slab collapses visually (face moves onto slab) | `scale(0.97)` |
| Disabled | `aria-disabled="true"` (not `disabled`, so it stays focusable and announces), 55% opacity, no shadow, no hover, label explains why ("Pago no disponible") | same | same |
| Loading (checkout hand-off) | label becomes "Abriendo Hotmart…", 16 px spinner (opacity-only dots under reduced motion), `aria-busy="true"`, `pointer-events:none` for 8 s then restores with "Reintentar" | n/a | n/a |
| Error (hand-off blocked or timeout) | inline `Notice` under the button: "No pudimos abrir Hotmart. Prueba de nuevo o escríbenos a {supportEmail}." | n/a | n/a |
| Visited (links) | unchanged | n/a | n/a |
| Reduced motion | no translate or shine; colour shift 100 ms and ring only | same | same |

Implementation: a `Button` primitive already exists (`src/shared/ui/button.tsx`, `button-variants.ts`); the new `sticker` variant, `loading` and `aria-disabled` states and the pressed colour are added there. Transitions list `transform` and `opacity` only (and background colour on controls at 150 ms because the layers are tiny, as [13] 2.3 rule 7 allows); `transition: all` is lint-banned.

### 3.2 Other controls

| Control | Spec |
|---|---|
| Age selector (radio chips) | 44 px chips; selection announced with `aria-live="polite"` ("Mostrando hojas para 5 años"); `<ViewTransition>` crossfade 150 out and 220 in; keyboard arrows within the group |
| FAQ | native `<details>`; marker plus to minus; height via `interpolate-size` or `::details-content` where supported, instant otherwise; first item open only on the kit page |
| Gallery and zoom | CSS scroll-snap carousel (drops `embla-carousel`, 7 KB gz); tap-to-zoom dialog lazy loaded on first intent; arrows and Escape; alt describes the sheet's purpose |
| Syllable playground | tap or keyboard; letters pop with `--ease-spring`; success is a sparkle, "¡Casi!" allowed, no red marks, no timers; `navigator.vibrate(10)` only if available and motion allowed |
| Sticky buy bar (mobile) | appears after the hero CTA leaves view (IntersectionObserver), 220 ms rise; hides while the offer card, final offer, footer, dialogs or consent banner are visible; price and CTA only; stack order: launcher (disabled) < sticky < consent < scrim < assistant panel |
| Consent banner | bottom sheet, maximum 168 px tall at 390 wide, three buttons of equal size and weight (Aceptar, Rechazar, Configurar), no pre-checked categories, closes without scroll lock, never covers the hero price or CTA at first paint (it renders after first paint, 600 ms) |

### 3.3 Lint that protects the system

Coral utilities only in `shared/ui/button*`, `features/commerce` and price blocks; no raw colour, spacing, radius literals outside tokens; no `transition: all`; no animation of layout properties; targets at least 44 px (24 px floor for inline text links); contrast pairs from the JSON.

## 4. Component states (async and interactive views)

Every async or conditional view has five states: default, loading (shown after 100 ms, skeleton only above 1 s), empty, error, success or partial.

| View | Loading | Empty | Error | Notes |
|---|---|---|---|---|
| Hotmart sales-funnel widget (`/imprime-y-juega/`) | existing skeleton plus `aria-live` status | n/a | existing neutral notice after 8 s, reload button; **title the iframe** (`title="Oferta de Hotmart"`) and name its link, or exclude it from axe with an issue and expiry (fixes the 2 serious violations) | height reserved |
| Gallery zoom | spinner on image decode | n/a | "No pudimos cargar la imagen" with close | |
| Video facade | poster first; video loads on click | n/a | text alternative and download link | muted, captions |
| Sample download card | "Preparando tu hoja…" 600 ms | n/a | "No pudimos descargar la hoja. Escríbenos a {supportEmail}" | no data collected (PV-D6) |
| Checkout hand-off | button loading state (3.1) | n/a | inline notice | |
| Consent | n/a | n/a | storage failure: choice held in memory for the document, banner shows again next visit | already implemented in `site-analytics` gate |
| Assistant | not rendered (disabled) | starter questions (when enabled) | offline notice with link to Soporte | section 8 |

## 5. The pages

### 5.1 Kit landing `/grafismo-fonetico/` (job: purchase decision; checkout is a link out)

Eleven blocks in this order (from [13] 4.3), each with one job, existing component, and the elevation:

| # | Block | Job | Component | Elevation |
|---|---|---|---|---|
| 1 | Hero and buy box | Who, what, age, price, guarantee, one CTA | `product-hero`, `hero-composition`, `buy-box` | Night-sky ground (navy-deep) with fanned real sheets (AVIF, preloaded, the LCP element, at most 150 KB); buy box is a paper card with `--shadow-paper-2`: `{price}`, "pago único", "Pagas en Hotmart, en tu moneda local", "PDF para imprimir en casa · acceso por correo", `{guaranteeDays}` días de garantía, coral CTA 56 px. All facts from config. h1 gains age and value |
| 2 | Trust strip | Remove digital-product doubt | `trust-row` | 4 icon items: pago seguro por Hotmart, acceso inmediato, garantía, contacto; no counters |
| 3 | See inside | Make the product concrete | `includes`, `page-wall`, `product-gallery` | **Scroll walkthrough**: sticky sheet preview that changes over 3-4 steps (CSS `view()` timeline; stacked static layout if unsupported or reduced motion); each step names what is on the page (letters, sounds, syllables, strokes) |
| 4 | Try it | Reduce risk with interaction | `playground-card` | Promoted right after block 3: "Pruébalo con tu hija o hijo"; the best honest proof; CTA under it |
| 5 | How it works | Print-and-use clarity | `method-steps` | Three steps: compras, descargas, imprimes ({paper_format}); this block carries the **sunrise** transition from navy to cream |
| 6 | Age fit | Is it for my child | `audience-cards`, `age-selector` | Result card says which pages to start with |
| 7 | Creator note | Human proof | `creator-note` | Named author and method, "Actualizado: {date}"; real photo only with consent (PV-D11) |
| 8 | Guarantee | Risk reversal | new small block | Plain guarantee with days and how to claim, link to `/compras-y-reembolsos/`; sits immediately before the offer |
| 9 | Offer | The decision | `offer-card` | Price, included list, CTA, payment line, security line; `border-glow` ring (existing, offer only) |
| 10 | FAQ | Objections | `FAQ` | Six real objections (what I receive, printing, age fit, payment and currency, refund, email not arriving); answers reuse `content/es/products/grafismo-fonetico/faq.ts` |
| 11 | Final CTA | Close | `final-offer` | Repeat price, guarantee, CTA; sunrise glow behind the star |
| - | Sticky buy bar | Persistent action | `sticky-cta` | Mobile only (3.2) |

Plus a secondary **sample sheet** card (sticker button) next to block 3: "Descargar una hoja de muestra" (PV-D6).

CTA rhythm: coral primary appears in blocks 1, 9, 11 and, once, after block 4; plus header pill and sticky bar; maximum four coral CTAs in the document flow. Identical label ("Obtener el kit") and identical `CheckoutLink`; the `sck` position per block (`header`, `hero`, `mid`, `final`, `sticky`, already implemented) is the only attribution that survives the cross-domain hand-off ([07] section 9). The hand-off opens in the same tab (existing behaviour; in-app browsers handle new tabs poorly, test in Instagram).

Above-the-fold budget at 390 x 844 (in-app viewport about 700 px): header 56, h1 90, one-line promise 52, fanned sheets 220, buy box 250 = about 670 px, so price, guarantee and the coral CTA are visible without scrolling; at 320 x 568 the header pill CTA (existing) keeps the action visible.

### 5.2 Hub `/` (job: route the parent to the right door in 5 seconds, 2 taps)

1. Header with "Productos" and the first-screen "Botón de arrepentimiento" link (keep).
2. Hero: h1 unchanged, plus a concrete lead (section 10): the two doors side by side from 360 px up, each with art, age, format and "Ver" (not "Comprar"); affiliate disclosure adjacent to its door.
3. Trust strip with the four real facts (Hotmart payment, guarantee days, digital access, local currency).
4. Chapters `#leer` and `#bebe` with equal weight; FAQ; closing doors.
5. Hub sticky bar follows the chapter in view.
The hub stays purchase-free by owner decision; the doors lead to the kit page or the disclosed affiliate redirect. Coral never appears on the hub (existing rule); navy actions only.

### 5.3 Other views

`/grafismo-fonetico/gracias/`: calm, no heavy JS, three steps (descargar, imprimir una hoja en {paper_format}, practicar {practice_minutes} minutos), support link, review request only after real delivery. `/soporte/`: contact paths and response time from config. Legal pages: same prose system, 65ch, print-friendly. 404, `error`, `global-error`: on-brand, link to home and kit, no JS dependency. `/imprime-y-juega/` (noindex): the widget fixes in section 4; no coral confusion with the kit.

## 6. Motion and micro-interactions that support conversion

Rules from [13] 2.3 apply (one hero motion per screen, transform and opacity only, exit before enter, interruptible, hover only where hover exists). Specific to conversion:

| Interaction | Behaviour | Budget |
|---|---|---|
| CTA press | 100 ms pressed state, then the loading label if the hand-off takes more than 300 ms | feedback at most 100 ms |
| Sticky bar | 220 ms rise after the hero CTA exits; hides over offer, footer, dialogs, banner | no layout shift |
| Price | no animation, no counters | trust |
| Walkthrough | crossfade with 8 px rise, 220 ms | CSS scroll-driven |
| Sunrise | one gradient layer's opacity from 0 to 1 over the "how it works" band | static final state without support |
| Playground | spring pop, sparkle on success | no sound |
| Route changes | page-level `<ViewTransition>` 150 out, 220 in plus 10 px rise; shared element from the hub door image to the kit hero; canvases excluded from snapshots | at most 400 ms; header persists |
| Prefetch on intent | the 2-3 money links prefetch on hover, focus and pointerdown | no fake navigation |

Device classes ([13] 2.5): Full (fine pointer, wide, no Save-Data), Lite (coarse pointer or small: static starfield SVG, no tilt), Still (`prefers-reduced-motion`: opacity-only reveals 100-150 ms, no parallax or orbit), Saved (Save-Data: no scene). **Decision D-03:** the WebGL scene mounts only on fine pointer at least 1024 px wide and after first interaction; phones use the existing static SVG starfield (visually the same composition). Listen for `matchMedia` changes at runtime. The pause control (WCAG 2.2.2) stays.

## 7. Kid-safe conduct and accessibility

- Nothing flashes; no sudden loud transitions; no autoplay audio; videos muted with controls and captions; all motion pausable.
- Targets 44 to 48 px; no drag-only interactions; no timers; no red failure marks.
- No third-party embeds in kid-facing interactive areas; YouTube only through a click-to-load facade; the playground makes no requests and stores nothing.
- WCAG 2.2 AA on every route; contrast aim 7:1 for body and price; focus ring never obscured; 200% and 400% zoom reflow; Lighthouse a11y 100 on every route; NVDA and VoiceOver pass on new patterns (view transitions, walkthrough, banner) per release.
- No stock "parents" with invented names; photos only with written consent and first names.

## 8. Assistant entry point (disabled until activation)

While disabled (now and through M7): the build emits nothing, reserves no space, causes no layout shift (CLS 0), makes no network call; support is the footer "Soporte" link and the contact email; the FAQ ends with "¿No encuentras tu respuesta? Escríbenos" linking to `/soporte/`. Tests: `assistant-disabled.spec.ts` plus a visual case for the disabled state; `check:assistant-disabled` on every publishable artifact.

Activation checklist (owner decision PV-D12, all required, recorded in `docs/assistant-activation.md`): golden set at 100% and refusal behaviour passed in `pequeverso-assistant-api`; disclosure visible in the panel header and in the first message; human handoff one tap away; price, guarantee and refund text read from the same source as the page (never model memory); privacy-policy section for assistant chat data written (PV-D8); holdout of 10 to 20% of traffic never sees it; panel code lazy loaded on intent (target at most 60 KB gz, to measure) and absent on Save-Data; answers never cover the checkout CTA.

Entry UX when enabled (spec for later): a labelled pill launcher "Pregúntanos" (not an icon-only bubble), bottom-right on desktop and above the sticky bar on phones, hidden while the offer card or the consent banner is visible; opens in 220 ms from its origin; starter questions drawn from real objections; `aria-live="polite"` transcript; Escape closes and returns focus to the launcher; no per-token layout animation.

## 9. Dark mode: no for now, dark-ready

Evidence ([06] section 8, [13] 4.8): NN/g finds light mode performs better for normal-vision users most of the time and recommends opt-in dark; a 2025 review favours light for readability and dark for comfort in low light; no evidence that dark changes e-commerce conversion; nothing favours dark for children; the kit photography's colour accuracy carries the conversion; a dark theme adds a full QA matrix to the page that sells. Therefore ADR-0006 stays (single light theme, owner decision). Built now: `color-scheme: light` in CSS and meta (Android WebView forced-dark opt-out), `light-dark()` indirection on every role, a log of `prefers-color-scheme: dark` share and evening-session share in the cookieless counter. Revisit trigger (planner judgment, not a standard): if dark share exceeds 25% of mobile sessions, ship a restrained "lectura nocturna" for legal and FAQ pages first, never the sales page.

## 10. Copy proposals (neutral Latin American Spanish, tú; owner approves, PV-D7)

Audience: Spanish-speaking buyers in Latin America and possibly Spain, so every string is es-419 neutral with tú and also reads naturally in Spain: no voseo, no "vosotros", no regional vocabulary (the invariants test carries a word list), "correo" not "mail", "imprimir" not "printear", prices as "US$14,99" with the local-currency note (euros appear only in Hotmart's checkout). The assistant entry, panel, disclosure and errors are Spanish only (existing: no language selector). Placeholders resolve from `config/commerce.ts`, `config/products/*.ts`, `config/affiliates.ts`, `config/site.ts`; none is hard-coded in copy: `{paper_format}` (A4 or carta, from the product config; the kit PDF is the single source and the copy names the format the PDF actually has), `{practice_minutes}` (product config), `{currency_note}` ("en tu moneda local", config/commerce.ts) and `{hotmart_consumer_url}` (config/commerce.ts) are config keys added in M3-8's config work and checked by the invariants test; copy files stay under `content/es/`. The existing invariants test (no outcome promises, config-sourced guarantee days, price formatter) keeps guarding these.

| Place | Proposal |
|---|---|
| Hub h1 (keep) | Un pequeño universo para cada etapa. |
| Hub lead (new, concrete) | Hojas imprimibles para practicar letras, sílabas y trazos ({kit_age}) y una guía recomendada para las primeras comidas de tu bebé ({course_age}). |
| Door CTAs | Ver el kit · Ver la guía recomendada |
| Kit h1 | Kit imprimible de Grafismo Fonético para niñas y niños de {kit_age} |
| Kit promise | Eliges una hoja, la imprimes y practicas con tu peque unos {practice_minutes} minutos: mira, di, traza y une. |
| Buy box | {price} · pago único / Pagas en Hotmart, {currency_note}. / PDF para imprimir en casa; el acceso llega a tu correo. / {guarantee_days} días de garantía en Hotmart. |
| Primary CTA | Obtener el kit |
| CTA loading and error | Abriendo Hotmart… / No pudimos abrir Hotmart. Prueba de nuevo o escríbenos a {support_email}. |
| Guarantee block | Tienes {guarantee_days} días para pedir el reembolso. Lo pides desde Hotmart dentro de ese plazo, contado desde la compra. Si estás en un país con un plazo legal de arrepentimiento más largo, escríbenos a {support_email} y lo gestionamos por correo. Más detalles por país en «Compras y reembolsos». |
| Sample card | Prueba una hoja real, sin dejar tu correo. [Descargar la hoja de muestra (PDF)] |
| Playground | Pruébalo: toca las sílabas en orden y forma la palabra. |
| Proof slot (only when real, consented) | Familias que ya lo usan: {first_name}, {country}: «{quote}» |
| Launch honesty line (only if the owner confirms there are no buyers yet) | Estamos en lanzamiento. Después de usarlo, cuéntanos qué mejorarías. |
| Consent banner | **Tu privacidad, tu elección.** Usamos solo lo necesario para que el sitio funcione. Si aceptas, también usamos Meta Pixel para medir nuestras campañas y el interés en los productos. Puedes cambiarlo cuando quieras. [Aceptar] [Rechazar] [Configurar] |
| FAQ questions | ¿Qué recibo exactamente? · ¿Cómo imprimo las hojas? · ¿Para qué edad es? · ¿Cómo pago y en qué moneda? · ¿Cómo pido el reembolso? · ¿Qué hago si no me llega el correo? |
| Thanks page | ¡Gracias por tu compra! Revisa tu correo: Hotmart te envía el acceso. Si no llega en unos minutos, mira en la carpeta de spam o entra a {hotmart_consumer_url}. 1. Descarga los PDF. 2. Imprime una hoja en {paper_format}. 3. Practica con tu peque {practice_minutes} minutos. Equipo de Pequeverso |
| 404 | No encontramos esa página. Vuelve al inicio o mira el kit. |
| Assistant disclosure (when enabled) | Soy un asistente automático de Pequeverso, no una persona. Respondo sobre los productos con la información de este sitio. Para pagos, reembolsos o problemas con tu compra, escríbenos a {support_email}. |
| Footer signature | Equipo de Pequeverso |

Rules: tú form with one addressee ("tú" plus "tu peque"; never mix with ustedes or third-person plural imperatives such as "practiquen"), no voseo, no regionalisms, no kid-voice calls to action, no outcome promises ("leerá en 30 días"), no invented counts or testimonials, affiliate disclosure next to every affiliate link, no health or nutrition advice.

## 11. Imagery and media

Real renders of the actual PDF pages only (640 and 1024 widths); decoration may be illustrated, product proof may not. Hero at most 150 KB AVIF (the existing 1024 w file is 122 KB), WebP fallback, exact `sizes`; gallery lazy with `fetchpriority="low"`; one preload only (the hero); poster-first video, muted, captions, at most 30 s; OG and share images per page showing the real sheet and no price (prices change); every image enters through `tools/media` with a manifest record (existing rule); illustrations that show people carry "Imagen ilustrativa." (existing).

## 12. Budgets and fluidity gates for design work

| Metric | Gate (mobile lab, 4G sim, 4x CPU) | Today |
|---|---|---|
| LCP | at most 2.0 s (hub: h1; kit: hero AVIF) | 4.4 s / 10.1 s |
| TBT | at most 200 ms | 2.1 s / 6.6 s |
| CLS | at most 0.05 | 0 |
| INP (lab interaction script) | at most 150 ms on the five money interactions | not measured |
| Long frames while scrolling | p95 at most 20 ms, p99 at most 33 ms, dropped at most 2%, zero long animation frames above 100 ms | not measured |
| First-load JS | at most 170 KB gz | 156.3 (hub) / 174.5 (kit) |
| Third-party requests before consent | 0 | pixel 209 KB |
| Fonts | at most 100 KB, 2 families | two variable files |

## 13. Acceptance and QA

Per view acceptance follows [13] section 5.2 with the changes of this playbook. Gates on every UI PR: visual regression (320, 390, 768, 1280 plus 1440; consent banner states; assistant disabled), axe 0 serious or critical, Lighthouse CI on the production-config build, frame-time and INP specs, design lint, reviewer plus architecture reviewer when structure changes, designer evaluator with screenshots. The evaluator scores against the designer rubric (visual 20, motion 20, performance 15, accessibility 15, responsive 10, navigation 10, uniqueness 10); any accessibility blocker caps at 89. A dev-only state gallery (`NEXT_PUBLIC_DESIGN_GALLERY` build flag, same pattern as the assistant flag, absent from publishable builds and verified by a check) renders every button state, notice and view state for visual tests.
