# Design system

The visual idea is the brand's "pequeño universo": a deep-navy sky with a starfield, soft planets
and an orbiting gold star, warm cream pages, real worksheet renders shown with subtle 3D depth,
and coral reserved for the single purchase action. The system is **Tailwind CSS 4.3 + shadcn/ui
on Base UI** (`base-vega`), with every value defined once in `src/app/globals.css`.
Decision record: `docs/decisions/ADR-0006-shadcn-tailwind-design-system.md`; spec:
`docs/specs/design-system.md`.

## Where things live

| Path | Contents |
|---|---|
| `src/app/globals.css` | fonts, tokens (`:root`), `@theme inline` bridge, `cq-*` variants, base layer, project utilities |
| `src/motion/motion.css` | reveal, hero entrance, orbit, parallax, sticky stack, tilt, details, flip view transition |
| `src/components/ui/` | shadcn primitives (Base UI) + `button-variants.ts`, `badge-variants.ts` |
| `src/components/blocks/` | server blocks composed from primitives and tokens |
| `src/components/layout/` | `page-shell`, `header` (+ `mobile-nav`, `mobile-nav-sheet`), `footer`, `legal-layout` |
| `src/motion/` | motion components, `page-motion`, `scene/` (lazy three + gsap starfield) |
| `src/lib/utils.ts` / `src/lib/cx.ts` | `cn` (merge on compiled tables) / `cx` (join, client islands) |

## Tokens

Raw brand values are OKLCH (`--pv-*`); semantic roles (shadcn names plus project roles) point at
them; `@theme inline` exposes both as utilities. Contrast pairs are recomputed from the token
source by `tests/unit/design-system.test.ts`.

| Token (utility) | Value (sRGB) | Use | Contrast |
|---|---|---|---|
| `--pv-navy` (`bg-navy`, `text-navy`) | `#003068` | brand, navy bands, `--secondary`, `--ring` | white 12.9:1 |
| `--pv-navy-deep` (`bg-navy-deep`) | `#00234e` | footer, topbar, navy cards | white 15.6:1 |
| `--pv-teal` / `--pv-teal-text` | `#007d79` / `#005e5b` | icons (`--icon`), links (`--link`), small labels | white/teal 5.0:1; teal-text/white 7.6:1 |
| `--pv-coral` / `--pv-coral-hover` | `#c64035` / `#a83129` | **only** the purchase CTA (`--primary`) and price | white 5.0:1 / 6.7:1 |
| `--pv-gold` | `#ffd840` | accents on navy, step numbers; never gold text on light | ink/gold 11.9:1; gold/navy 9.3:1 |
| `--pv-turquoise` | `#7fe3d9` | accent on navy only (`--accent` inside `on-navy`) | 8.6:1 on navy |
| `--pv-cream` / `--pv-white` | `#fffaf2` / `#fff` | `--background` / `--card` | — |
| `--pv-ink` / `--pv-body` / `--pv-muted` (`text-ink`, `text-body`, `text-subtle`) | `#0b1f3a` / `#425267` / `#5d6b80` | headings, body, notes | 15.9 / 7.7 / 5.2 on cream |
| soft bands (`bg-mint`, `bg-sky`, `bg-lemon`, `bg-rose`) | `#e4f7f5` `#e8f3ff` `#fff5bf` `#fff0eb` | at most one soft band between two neutral ones; tints of the tone chips | teal-text/mint 6.5, coral-hover/rose 5.5, ink/lemon 14, navy/sky 11 |
| aurora stops `--pv-celeste` / `--pv-blue-soft` / `--pv-peach` (`bg-celeste`, …) | `#dcefff` `#cfe0ff` `#ffe9dc` | gradient stops only (aurora bands, `Card gradient`, media grounds) | body/celeste 6.5, muted/celeste 4.5 |
| `--pv-line` / `--pv-line-strong` | navy 14 % / 28 % | `--border` / `--input` | UI 3:1 via 2 px borders where it matters |
| focus | `outline: 3px var(--ring)` + 2 px offset | navy on light, gold inside `on-navy` | visible on every band |

Semantic roles: `--background`, `--foreground`, `--card`, `--popover`, `--primary`(+`-foreground`,
`-hover`), `--secondary`(+…), `--muted`, `--muted-foreground`, `--accent`, `--border`, `--input`,
`--ring`, `--heading`, `--body`, `--link`, `--link-hover`, `--chip`, `--chip-foreground`,
`--icon`, `--surface-veil`. **`on-navy`** re-scopes them for navy surfaces (white headings, 86 %
white body, gold chips/icons/focus) and **`on-light`** restores them for light surfaces inside a
navy band. `Section tone="navy"`, `Card variant="navy"` and the footer apply `on-navy`; light
cards, price blocks, notices and fact chips apply `on-light`.

**Type.** Fraunces 700 (`font-display`: h1, h2, price) and Nunito Sans 500–800 (`font-sans`),
self-hosted with metric-matched fallbacks (`docs/performance.md`). Fluid sizes: `text-display`
38→72, `text-h2` 32→52, `text-h3` 20→22, `text-lead` 17→19, `text-base` 16→17, `text-small` 14,
`text-tiny` 13, `text-price` 38→44. Base styles set h1–h4, p, strong and links from the roles.

**Spacing.** 4-pt: Tailwind's `--spacing` (0.25rem) gives `p-4 = 1rem`; the `--space-1…9`
aliases remain for CSS Modules. `section-pad` 56→96 px, `page-container` 1200 px with a
20–24 px fluid gutter. **Radius:** `rounded-sm` 4, `rounded-chip` 6, `rounded-md` 12 (small
tiles, list strips), `rounded-lg` 20 (cards, FAQ, media), `rounded-xl` 28 (redesign cards: glass,
elevated, gradient, emphasis, price, resource tiles), `rounded-2xl` 36 (hero/bento), `rounded-pill`
(every button, chip and badge). **Elevation:** `shadow-sm|md|lg` (navy-tinted), `shadow-float`
(layered contact + ambient: floating cards, open FAQ, hover lift), `shadow-glow`, `shadow-cta` /
`shadow-cta-hover` (coral). **Surfaces:** `glass` (white 72 % + blur, solid fallback) and
`glass-dark` (white 8 % on navy) are the only backdrop blurs; `text-gradient` (navy → teal) /
`text-gradient-sky` (turquoise → gold) mark one accent phrase per heading; `border-glow` rings the
offer card only.

**Motion tokens.** `--duration-fast` 150 ms, `--duration` 220 ms, `--duration-reveal` 480 ms,
`--duration-hero` 600 ms, `--duration-orbit` 48 s, `ease-out` / `ease-emphasis`, `--stagger`
60 ms (× `--i`), `--reveal-y` 16 px, `--parallax-range` 20 px, `--tilt-max` 6°,
`--tilt-perspective` 900 px. **Layout:** `--header-height`, `--sticky-bar-height`,
`--section-overlap`, `--section-intrinsic`, `--wave-height`, `--badge-sm|md|lg`.

## Primitives (`src/components/ui`)

shadcn/ui components on Base UI, restyled with tokens; every root has `data-slot`. Base UI
composes custom elements with `render` (no `asChild`); for links styled as buttons use
`buttonVariants()` on `<a>`/`<Link>` (or `CTAButton`).

| Primitive | API |
|---|---|
| `button` / `buttonVariants` | All pills. `variant: primary` (coral gradient that slides to the deep stop on hover, `.pv-shine` sweep, coral shadow, 2 px lift; CTA only) `\| secondary` (navy gradient) `\| outline \| inverse \| ghost \| link` — `secondary`/`outline`/`ghost` turn white-on-navy inside `on-navy`; `size: default` (56 px) `\| sm` (44 px) `\| lg` (64 px) `\| xl` (60 px, full width: the store "add to cart") `\| icon` (44 px circle); `block`. Icons: `data-icon="inline-start\|inline-end"`; the `inline-end` arrow slides 4 px on hover/focus (motion-safe) |
| `badge` / `badgeVariants` | Pills. `variant: chip` (roles: mint, gold inside `on-navy`) `\| turquoise \| coral` (offer only) `\| gold-soft \| sky` (pale tint + dark text; translucent + bright text inside `on-navy`) `\| gold \| navy \| outline \| soft \| glass`; `dot` (colour dot, the eyebrow look); `render` |
| `card` | `Card variant: default \| emphasis \| soft \| navy \| glass \| glass-dark \| elevated \| gradient`, `pad: none \| sm \| md \| lg \| xl`, `lift` (hover: −4 px + `shadow-float`, motion-safe), `as`, `reveal` (`true \| "blur"`), `stagger`; `CardHeader`, `CardTitle as`, `CardDescription`, `CardContent`, `CardFooter` |
| `dialog`, `sheet` | Base UI dialog; `DialogContent`/`SheetContent side` with `closeLabel` (Spanish), transitions on `data-starting-style`/`data-ending-style` |
| `accordion` | Base UI accordion (interactive use); `AccordionItem variant: card` (separate rounded cards, +/− marker that folds into −, the open card floats) `\| lines` (store product-details look: hairlines, bold titles, no boxes); FAQ content uses the zero-JS `FAQ` block |
| `tabs`, `radio-group` | chip look; `RadioGroupItem variant: dot \| chip` |
| `tooltip` | supplementary only, never the only label |
| `separator`, `skeleton`, `table` | `Separator` is a server component (no client JS); `Table` scrolls horizontally inside its own container and, inside `prose`, is framed, tightened and hyphenated on narrow containers |

## Blocks (`src/components/blocks`)

Server components; props kept compatible with the previous PascalCase primitives.

| Block | Props |
|---|---|
| `Container` | `as?`, `className?` |
| `Section` | `tone?: cream\|white\|mint\|sky\|lemon\|rose\|navy`, `id?`, `labelledBy?`, `label?`, `divider?: none\|wave-top\|wave-bottom\|overlap`, `dividerTone?`, `defer?`, `container?` (default true), `backdrop?` (decorative layer under the wave and content, e.g. `<Universe variant="band" />`), `className?` — renders `data-slot="section"` + `data-tone`; `wave-top` overlaps the previous band by 1 px so no seam shows |
| `SectionHeading` | `id`, `kicker?`, `title` (node: wrap one phrase in `text-gradient`), `lead?`, `align?: start\|center`, `tone?`, `kickerAccent?`, `size?: default\|lg`, `reveal?: rise\|blur\|none` |
| `Eyebrow` | `tone?`, `as?: p\|span`, `accent?: auto\|turquoise\|coral\|gold\|sky\|navy\|glass` (pill with a colour dot; `coral` labels the offer only), `dot?` |
| `Stack` | `gap?: 2–6`, `maxWidth?`, `align?`, `as?`, `id?` |
| `Grid` | `cols?: 2\|3\|4` (container queries), `min?` (auto-fit), `gap?: 3–6`, `as?: div\|ul\|ol` |
| `Split` | `ratio?`, `align?`, `stickyAside?`, `mediaFirstOnTablet?`, `children: [copy, media]` |
| `BulletList` | `items`, `icon?` (in a round tinted disc; `check` draws a plain tick), `as?: ul\|ol`, `tone?`, `variant?: plain\|card` |
| `ChipRow`, `FactChip` | `align?` / `icon?`, `label`, `detail?`, `tone?` — glass pill (glass-dark on navy) with the icon in a disc |
| `IconDot` | `icon`, `size?: sm\|md\|lg` — the shared round marker (tint of `--accent`: teal on light, turquoise on navy) |
| `NumberedList` | `items`, `tone?` — short ordered instructions with gold number discs |
| `IconBadge`, `IconCardList` | `icon`, `size?: 48\|56\|72`, `tone?`, `accent?: auto\|turquoise\|gold\|coral\|navy` (rounded gradient tile), `shape?: square\|circle`, `number?` / `items`, `cols?`, `numbered?`, `tone?`, `variant?` (card surface, default `elevated`; `glass-dark` on navy), `accent?` — cards lift on hover |
| `MediaFrame`, `MediaImage` | `ratio?: 4/3\|3/4\|16/9\|1/1`, `elevation?: none\|sm\|md\|lg\|float`, `radius?: lg\|xl`, `framed?` (white paper edge), `tilt?`, `as?` / manifest `id`, `sizes`, `priority?`, `alt?` |
| `PriceBlock` | `kicker`, `price`, `previous?`, `taxNote`, `currencyNote?` (default `localCurrencyNote`, globe icon), `cta`, `ctaNote?`, `tone?`, `surface?: card\|glass\|none` (`none` inside another card), `id?` |
| `Steps`, `FAQ`, `ResourceGrid`, `Notice` | `steps`, `tone?`, `accent?` (gradient tiles on a dotted line) / `items`, `openFirst?`, `surface?: card\|glass\|lines` (native `<details>`, +/− marker) / `resources`, `compact?`, `total?`, `badges?` (tiles lift and zoom their cover on hover) / `tone?`, `title?`, `role?` |
| `AssuranceList` | `items: { icon, text }[]`, `layout?: inline\|stack`, `tone?` — payment/access/guarantee facts next to a purchase action (icons in discs) |
| `ProductBadge` | `label`, `icon?`, `tone?: light\|soft\|gold\|navy`, `as?` — store badge: compact sentence-case pill ("PDF imprimible") |
| `TrustRow` | `items: { icon, label, detail? }[]`, `layout?: grid\|inline`, `divided?`, `tone?` — compact trust strip under a buy button (2 columns on phones, one divided row from `cq-md`) |
| `PriceTag` | `price`, `previous?`, `note?`, `size?: md\|lg`, `tone?` — store price line: Fraunces tabular price + compact tax note |
| `CTAButton` | button-variant props + `href?`, `external?`, `icon?`, `iconAfter?: arrow\|external\|LucideIcon`; external → `target="_blank" rel="noopener"` + external icon |
| `BrandLogo`, `SocialLinks`, `SkipLink`, `Topbar`, `Icon` | `variant?`, `wordmark?: always\|sm-up`, `priority?` / `tone?`, `size?` / — / `items?`, `tone?` / `name` |

**Store vocabulary (product page, a DTC "PDP" look on the universe identity).** Compose the buy
column as a `ProductBadge` row → `h1` → `PriceTag` (price + compact tax note) → the checkout link
with `buttonVariants({ size: "xl" })` (60 px, full width) → `TrustRow` (facts from
`config/commerce`) → `FAQ surface="lines"` (or `AccordionItem variant="lines"`) for product
details. Coral stays for the price and the purchase action; badges and trust icons are
teal/navy/gold. Every shared piece reads `on-navy`/`on-light` from its surface; tone chips,
buttons and badges switch to their navy look through `.on-navy &:not(.on-light &)`.

## Motion

Layers, in order of preference: **(1) CSS** — `[data-reveal]` on a view timeline (`entry` range,
staggered by `--i`; an element already in view is at 100 %, nothing flashes), `[data-hero-enter]`
(h1 and media never animate opacity, so LCP paints at once), Base UI transitions on
`data-starting-style`/`data-ending-style`, native `<details>` height via `interpolate-size`;
**(2) React `<ViewTransition>`** (HeroStack, AgeSelector); **(3) gsap, lazily** — `loadGsap()`
(`src/motion/gsap-loader.ts`) imports gsap in its own async chunk on intent or when a component
nears the viewport: the FlipPreview turn, the 3D scene (ticker, `quickTo`, scrubbed ScrollTrigger)
and, only where CSS view timelines are missing (Firefox), `RevealObserver` → `fallback-motion.ts`
(ScrollTrigger.batch reveals and scrubbed `Parallax`, `gsap.matchMedia` for reduced motion). gsap
core ≈ 19.5 KB and ScrollTrigger ≈ 17 KB gzip live in the deferred closure (`check:scene`), never
in a route's initial JS. The hero entrance stays CSS (it must run before any JavaScript so LCP is
untouched); **(4) WAAPI** —
`PageMotion` raises below-the-fold sections 8 px (240 ms, no fill mode, cancelled when reduced
motion turns on). **3D** is limited to `src/motion/scene`: `SceneStage` keeps the server-rendered
static layers (`StaticStarfield`: a seeded 320 px SVG pattern tile defined once by the hero and
reused by bands, the planets marked `data-scene-planet`/`data-scene-depth`, the `Orbit` marked
`data-scene-orbit`). After `load` + idle it creates a canvas and `await import()`s
`scene-runtime.ts` (three + gsap ScrollTrigger), which rebuilds the same universe in WebGL at the
positions the static layers occupy (seamless crossfade via `data-live`): a layered starfield with
depth, lit planet impostors with the CSS gradient stops (`--pv-planet-*`), the gold star on its
orbit with a trail. One scroll progress (ScrollTrigger) drives a dolly with frame-rate
independent smoothing; fine pointers add camera parallax; camera and planets are written only
when they change. Adaptive quality (DPR cap and star share) follows measured frame times; the
loop pauses off-screen or in hidden tabs; a lost context falls back to the static layers until it
is restored. No canvas exists under reduced motion, Save-Data or viewports under 650 px tall. The
pause toggle (`data-mode="running|paused|static"`, WCAG 2.2.2) also stops the CSS orbit.
Band orbits (`Orbit motion="scroll"`) follow a view timeline, so they only move while scrolling.

Rules: transform/opacity only; layout reserved (aspect ratios, `Parallax` padding, `Counter`
min-width); every animation behind `prefers-reduced-motion: no-preference` plus the global kill
switch; scroll-driven rules behind `@supports (animation-timeline: view())`; no `will-change`,
blur or filter keyframes (the one exception is `[data-reveal="blur"]`, scroll-driven only); no
autoplaying video.

Redesign motion classes (`motion.css`): `.pv-float` (7 s bob, `--float-delay`/`--float-range`),
`.pv-marquee` (+ `-track`, pauses on hover/focus/`data-paused`, static wrapped row under reduced
motion), `.pv-glow-spin` (turns the `border-glow` ring), `.pv-shine` (hover sweep, built into
`buttonVariants` primary), `.pv-scroll-progress`, `.pv-header-pill`, `[data-reveal="blur"]`
(`Card reveal="blur"`, `SectionHeading reveal="blur"`). Block micro-interactions use
`motion-safe:` utilities on `translate`/`scale`/`rotate` only: button lift and arrow slide, card
and resource-tile lift, resource cover zoom, FAQ marker turn; `::details-content` height as above.

| Motion component | Kind | API |
|---|---|---|
| `useMotionOK()` | hook | `{ ok, reducedMotion, finePointer, saveData }` |
| `RevealObserver` | client (layout) | fallback for browsers without view timelines |
| `PageMotion` | client (PageShell) | wraps main content |
| `TiltCard`, `Counter`, `FlipPreview` | client | `max?`, `as?` / `value`, `format?` / `front`, `back`, `showLabel?`, `hideLabel?`, `ratio?` — a real 3D turn: one inner element rotates on Y (gsap, 560 ms `power2.inOut`) in a `perspective` parent with `preserve-3d`, faces `backface-visibility: hidden` (+ `-webkit-`), back pre-rotated 180°, `will-change` only while turning, the shadow is a separate layer whose opacity dips (no box-shadow animation), images `decode()`d first; reduced motion crossfades |
| `Parallax`, `StickyStack`, `WaveDivider`, `Orbit` | server | `direction?` / `items` (≤ 6) / `fill`, `flip?` / `className?` |
| `Universe` | server | `variant?: hero\|band` — hero: sky + planets + `SceneStage` (live); band: static stars + scroll-driven orbit |
| `SceneStage`, `useSceneRuntime` | client | `children` (static layers), `pauseLabel?`, `playLabel?`, `options?: { seed, count, parallax }`; stage carries `data-mode` and `data-live` |
| `StickyCTA` | client | `hideWhenVisible`, `label`, `note?`, `children` — below lg, hidden over dialogs |

## Responsive contract

Acceptance criterion for every block and page, 320 → 1920 px, enforced by
`tests/e2e/responsive.spec.ts` (PR set; Chromium and WebKit nightly) and the overflow check in
`smoke.spec.ts` at every nightly width:

- Content-driven layout: blocks read their container (`cq` + `cq-sm|md|lg|xl`, same thresholds
  as sm 640 · md 768 · lg 1024 · xl 1280); pages never write media queries. Type and section
  spacing are fluid (`clamp()`).
- No fixed widths wider than the column; grid children are `min-w-0`; `Stack` caps children at
  100 %; labels wrap (badges have no `nowrap`); images and media keep `max-width: 100%` and their
  natural aspect (`object-fit` only inside `MediaFrame`); tables use `Table` (legal tables fit from 320 px).
- Targets ≥ 44 px for controls (24 px minimum for inline links); the header CTA is inside the
  first viewport at ≤ 768 px; at < 640 px the header drops the wordmark and decorative CTA icons.
- Fixed layers never cover the CTA: the sticky bar hides over the hero CTA, price card, offer,
  final offer, footer and open dialogs; the consent banner is capped at 60 dvh; checked at 640×360.
- Third-party embeds: the Hotmart iframe (inline `min-width: 320px`) bleeds to the viewport edges
  below 400 px instead of overflowing.

## How to change…

- **Brand colour:** edit the `--pv-*` value in `globals.css` (OKLCH); run `npm test` — the
  contrast test fails if a documented pair drops below its ratio.
- **CTA colour:** change `--primary`/`--primary-hover` (and `--pv-shadow-cta`); nothing else uses coral.
- **Font:** replace the `@font-face` block and the preload list in `src/app/layout.tsx`, then
  `--pv-font-display`/`--pv-font-sans`; re-measure the fallback metrics (`docs/performance.md`).
- **Radius:** edit `--pv-radius-*` (cards `rounded-lg`/`rounded-xl`, buttons and chips `rounded-pill`).
- **Section band:** add `--pv-<band>` + `--color-<band>` in `@theme inline`, a `tone` entry in
  `sectionVariants` and the `WaveFill` union.
- **Spacing:** section rhythm `--section-pad`, gutter `--gutter`, column `--page-max`; component
  spacing uses the Tailwind scale.
- **Animation duration/easing:** `--duration*`, `--pv-ease-*`, `--stagger`, `--reveal-y`.
- **A new primitive:** `npx shadcn@latest add <name>` (Base UI), then restyle with roles, add
  `data-slot`, keep targets ≥ 44 px, record it in `docs/assets/shadcn-ui.md`.

## Page templates

**Home and principal landing** (`src/app/page.tsx`, `CoreLanding`, `features/landing/core/*`,
`AgeSelector`, gallery and video) are built only from primitives, blocks and utilities; no CSS
Modules remain there. `HeroScene` places copy, the `HeroStack` of real worksheets, the sticky price
aside and the desk on one container-query grid (below lg: copy → real pages → price → desk).
Conversion rules applied: one dominant action per viewport (coral only for purchase; home links
to the product are white/navy), hierarchy H1 → value → real pages → price → CTA, assurances
(payment through Hotmart, access, `guaranteeDays`) next to every purchase CTA, objections
(`#para-quien`, FAQ) right after the offer, the mobile sticky bar hidden over any CTA. The age
selector keeps the `RadioGroup variant="chip"` look on native radios (Base UI's radio runtime
cost ~20 KB gzip on the landing). Landing order: `#hero` (with `#comprar` and `#incluye`) →
problema → `#metodo` → `#videos` → `#paginas` → `#oferta` (overlapping the gallery band) →
`#para-quien` → author's note → `#preguntas` → `#oferta-final` → `StickyCTA`; bands are joined by
waves and navy bands carry `Universe variant="band"`.

**Offer (`/imprime-y-juega/`, upsell and `?downsell=1`), thanks, legal, soporte, 404** use only
blocks, primitives and utilities (no CSS Modules). Offer order: `#hero` / `#hero-downsell`
(reassurance eyebrow, counters, `PriceBlock`, real image / objection cards) → decision band
(static sky, one `#hotmart-sales-funnel` inside `#gfp-decision`, reassurance chips; its region
carries `data-motion="none"`, so `PageMotion` never moves it) → complement → `#incluye` →
`#paginas` (upsell) → moments → `#preguntas` → `#cierre` → `StickyCTA` (hidden over the heroes,
the decision, the close band and the footer). Legal pages: `LegalLayout` (68ch `prose`, carded
sticky `toc` index, `Separator`), tables through `Table`, `dl` as ruled rows.

**Class merging.** `cn` compiles its tables with `config/cn.ts`, which registers the
theme's font sizes (`text-price`, `text-h3`, `text-small`…) and shadows; without it a text colour
next to a custom size dropped the size.
