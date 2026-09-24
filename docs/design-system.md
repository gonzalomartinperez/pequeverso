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
| soft bands (`bg-mint`, `bg-sky`, `bg-lemon`, `bg-rose`) | `#e4f7f5` `#e8f3ff` `#fff5bf` `#fff0eb` | at most one soft band between two neutral ones | — |
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
34→60, `text-h2` 30→42, `text-h3` 20→22, `text-lead` 17→19, `text-base` 16→17, `text-small` 14,
`text-tiny` 13, `text-price` 38→44. Base styles set h1–h4, p, strong and links from the roles.

**Spacing.** 4-pt: Tailwind's `--spacing` (0.25rem) gives `p-4 = 1rem`; the `--space-1…9`
aliases remain for CSS Modules. `section-pad` 56→96 px, `page-container` 1200 px with a
20–24 px fluid gutter. **Radius:** `rounded-sm` 4, `rounded-chip` 6, `rounded-md` 8 (buttons,
media), `rounded-lg` 12 (cards), `rounded-xl` 16, `rounded-pill` (primary CTA, chips).
**Elevation:** `shadow-sm|md|lg` (navy-tinted), `shadow-cta` (coral glow); no backdrop blur.

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
| `button` / `buttonVariants` | `variant: primary` (coral pill, CTA only) `\| secondary` (navy) `\| outline \| inverse \| ghost \| link`; `size: default` (56 px) `\| sm` (44 px) `\| lg \| icon` (44 px); `block`. Icons: `data-icon="inline-start\|inline-end"` |
| `badge` / `badgeVariants` | `variant: chip` (mint; gold inside `on-navy`) `\| gold \| navy \| outline \| soft`; `render` |
| `card` | `Card variant: default \| emphasis \| soft \| navy`, `pad: none \| md \| lg`, `as`, `reveal`, `stagger`; `CardHeader`, `CardTitle as`, `CardDescription`, `CardContent`, `CardFooter` |
| `dialog`, `sheet` | Base UI dialog; `DialogContent`/`SheetContent side` with `closeLabel` (Spanish), transitions on `data-starting-style`/`data-ending-style` |
| `accordion` | Base UI accordion (interactive use); FAQ content uses the zero-JS `FAQ` block |
| `tabs`, `radio-group` | chip look; `RadioGroupItem variant: dot \| chip` |
| `tooltip` | supplementary only, never the only label |
| `separator`, `skeleton`, `table` | `Table` scrolls horizontally inside its own container |

## Blocks (`src/components/blocks`)

Server components; props kept compatible with the previous PascalCase primitives.

| Block | Props |
|---|---|
| `Container` | `as?`, `className?` |
| `Section` | `tone?: cream\|white\|mint\|sky\|lemon\|rose\|navy`, `id?`, `labelledBy?`, `label?`, `divider?: none\|wave-top\|wave-bottom\|overlap`, `dividerTone?`, `defer?`, `container?` (default true), `className?` — renders `data-slot="section"` + `data-tone` |
| `SectionHeading` | `id`, `kicker?`, `title`, `lead?`, `align?: start\|center`, `tone?` |
| `Eyebrow` | `tone?`, `as?: p\|span` |
| `Stack` | `gap?: 2–6`, `maxWidth?`, `align?`, `as?`, `id?` |
| `Grid` | `cols?: 2\|3\|4` (container queries), `min?` (auto-fit), `gap?: 3–6`, `as?: div\|ul\|ol` |
| `Split` | `ratio?`, `align?`, `stickyAside?`, `mediaFirstOnTablet?`, `children: [copy, media]` |
| `BulletList` | `items`, `icon?`, `as?: ul\|ol`, `tone?` |
| `ChipRow`, `FactChip` | `align?` / `icon?`, `label`, `detail?`, `tone?` |
| `IconBadge`, `IconCardList` | `icon`, `size?: 48\|56\|72`, `tone?`, `number?` / `items`, `cols?`, `numbered?`, `tone?` |
| `MediaFrame`, `MediaImage` | `ratio?`, `elevation?`, `tilt?`, `as?` / manifest `id`, `sizes`, `priority?`, `alt?` |
| `PriceBlock` | `kicker`, `price`, `previous?`, `taxNote`, `currencyNote?` (default `localCurrencyNote`, globe icon), `cta`, `ctaNote?`, `tone?`, `id?` |
| `Steps`, `FAQ`, `ResourceGrid`, `Notice` | `steps`, `tone?` / `items`, `openFirst?` (native `<details>`) / `resources`, `compact?`, `total?` / `tone?`, `title?`, `role?` |
| `CTAButton` | button-variant props + `href?`, `external?`, `icon?`, `iconAfter?: arrow\|external\|LucideIcon`; external → `target="_blank" rel="noopener"` + external icon |
| `BrandLogo`, `SocialLinks`, `SkipLink`, `Topbar`, `Icon` | `variant?`, `wordmark?: always\|sm-up`, `priority?` / `tone?`, `size?` / — / `items?`, `tone?` / `name` |

## Motion

Layers, in order of preference: **(1) CSS** — `[data-reveal]` on a view timeline (`entry` range,
staggered by `--i`; an element already in view is at 100 %, nothing flashes), `[data-hero-enter]`
(h1 and media never animate opacity, so LCP paints at once), Base UI transitions on
`data-starting-style`/`data-ending-style`, native `<details>` height via `interpolate-size`;
**(2) React `<ViewTransition>`** (FlipPreview, HeroStack, AgeSelector); **(3) WAAPI** —
`PageMotion` raises below-the-fold sections 8 px (240 ms, no fill mode, cancelled when reduced
motion turns on). **3D** is limited to `src/motion/scene`: `SceneStage` keeps the server-rendered
static layers (`StaticStarfield`: a seeded 320 px SVG pattern tile, planets, `Orbit`), lazily
imports `scene-runtime.ts` (three + gsap ScrollTrigger) inside an effect, skips it under reduced
motion, Save-Data or viewports under 650 px tall, pauses off-screen or in hidden tabs, drops DPR
on slow frames, recovers from context loss and shows a pause button (WCAG 2.2.2).

Rules: transform/opacity only; layout reserved (aspect ratios, `Parallax` padding, `Counter`
min-width); every animation behind `prefers-reduced-motion: no-preference` plus the global kill
switch; scroll-driven rules behind `@supports (animation-timeline: view())`; no `will-change`,
blur or filter keyframes; no autoplaying video.

| Motion component | Kind | API |
|---|---|---|
| `useMotionOK()` | hook | `{ ok, reducedMotion, finePointer, saveData }` |
| `RevealObserver` | client (layout) | fallback for browsers without view timelines |
| `PageMotion` | client (PageShell) | wraps main content |
| `TiltCard`, `Counter`, `FlipPreview` | client | `max?`, `as?` / `value`, `format?` / `front`, `back`, `showLabel?`, `hideLabel?`, `ratio?` |
| `Parallax`, `StickyStack`, `WaveDivider`, `Orbit` | server | `direction?` / `items` (≤ 6) / `fill`, `flip?` / `className?` |
| `Universe` | server | `variant?: hero\|band` — sky + `SceneStage` |
| `SceneStage`, `useSceneRuntime` | client | `children` (static layers), `pauseLabel?`, `playLabel?`, `options?: { seed, count, parallax }` |
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
  natural aspect (`object-fit` only inside `MediaFrame`); tables scroll inside `Table` / `.table-wrap`.
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
- **Radius:** edit `--pv-radius-*` (cards use `rounded-lg`, buttons `rounded-md`, CTA `rounded-pill`).
- **Section band:** add `--pv-<band>` + `--color-<band>` in `@theme inline`, a `tone` entry in
  `sectionVariants` and the `WaveFill` union.
- **Spacing:** section rhythm `--section-pad`, gutter `--gutter`, column `--page-max`; component
  spacing uses the Tailwind scale.
- **Animation duration/easing:** `--duration*`, `--pv-ease-*`, `--stagger`, `--reveal-y`.
- **A new primitive:** `npx shadcn@latest add <name>` (Base UI), then restyle with roles, add
  `data-slot`, keep targets ≥ 44 px, record it in `docs/assets/shadcn-ui.md`.

## Page templates (migrating in follow-up PRs)

Home, landing, offer, thanks and the gallery/video/age-selector islands still style their own
geometry in CSS Modules (tokens via `var()`, never `@apply`) while rendering through the blocks
above. The hero "la mesa bajo el pequeño universo" (`src/features/landing/core/HeroScene`,
`HeroStack`, `AgeSelector`) and the landing order are described in `docs/specs/design-system.md`
(migration plan) and remain as before: `#hero` (with `#comprar` and `#incluye`) → problema →
`#metodo` → `#videos` → `#paginas` → `#oferta` → `#para-quien` → author's note → `#preguntas` →
`#oferta-final` → `StickyCTA`.
