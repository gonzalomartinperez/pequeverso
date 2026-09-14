# Design system

The visual idea is the brand's "pequeño universo": a deep-navy sky with a starfield, soft planets
and an orbiting gold star (`Universe` component, pure CSS), warm cream pages, real worksheet
renders shown with subtle 3D depth (tilt cards, receding carousel slides), and coral reserved for
the single purchase action. Everything is driven by the tokens in `src/styles/tokens.css`.

## Colour

| Token | Value | Use | Contrast (checked 2026-09-12) |
|---|---|---|---|
| `--pv-navy` | `#003068` | brand, dark bands, header CTA text | white on navy 12.9:1 |
| `--pv-navy-deep` | `#00234e` | footer, topbar | white 15.6:1 |
| `--pv-teal` / `--pv-teal-text` | `#007d79` / `#005e5b` | icons, links; small labels | white on teal 5.0:1; teal-text on white 7.6:1 |
| `--pv-coral` / `--pv-coral-hover` | `#c64035` / `#a83129` | **only** primary CTA and price | white 5.0:1 / 6.7:1 |
| `--pv-gold` | `#ffd840` | star accents, chips, headings on navy | ink on gold 11.9:1 — never gold text on light |
| `--pv-ink` / `--pv-body` / `--pv-muted` | `#0b1f3a` / `#425267` / `#5d6b80` | text | 15.9 / 7.7 / 5.2 on cream |
| `--pv-cream` | `#fffaf2` | page background | — |
| soft bands | mint `#e4f7f5`, sky `#e8f3ff`, lemon `#fff5bf`, rose `#fff0eb` | alternate at most one soft band between two neutral bands | — |
| `--pv-hero-top` / `--pv-hero-bottom` | `#00234e` / `#003068` | hero and band gradients (`Universe`) | as navy-deep / navy |
| `--pv-turquoise` | `#7fe3d9` | accent **on navy only** (icons, rules, orbit highlights) | 8.6:1 on navy; never on light |
| `--pv-on-navy` / `--pv-on-navy-chip` | `rgba(255,255,255,.86)` / `rgba(255,255,255,.12)` | body text and chip fills on navy | 9.9:1 on navy |
| focus | navy 3 px ring + 2 px white halo | every focusable element | visible on all backgrounds |

Retired from the WordPress landings: `#df5a4f` (3.7:1), `#00a9a4` text (2.9:1), gold focus ring
(1.3:1), the purple downsell theme, Baloo 2, Roboto.

## Type

Fraunces (variable, 700) for display/H1/H2/price; Nunito Sans (variable, 500–800) for everything
else. Fluid scale via `clamp()`: H1 34→60, H2 30→42, lead 17→19, body 16→17, price 38→44.
Weights are capped at 800. Fonts are self-hosted (`public/fonts`, OFL) with hand-written `@font-face` rules, preloaded from the
root layout and metric-matched fallbacks (`docs/performance.md`).

## Spacing, radius, elevation, breakpoints

- 4-pt scale (`--space-1` … `--space-9`); section padding 56→96 px; container 1200 px with a
  20–24 px gutter; mobile gutter never below 20 px.
- Radius: 6 (chips), 8 (buttons, cards, media), 12 (large cards), pill only for chips.
- Elevation: three navy-tinted shadows plus a coral CTA glow. No backdrop blur.
- Breakpoints (min-width): **sm 640 · md 768 · lg 1024 · xl 1280**, declared once in the header of
  `tokens.css` and exported from `src/lib/breakpoints.ts` (`breakpoints`, `below()`). Primitives use
  the same numbers in **container queries**; pages never write `@media`.
- Layout tokens: `--section-overlap` (4 rem), `--section-intrinsic` (640 px, `contain-intrinsic-size`
  for deferred sections), `--wave-height` (`clamp(2rem, 6vw, 4.5rem)`), `--badge-sm/md/lg` (48/56/72).

## Motion tokens and policy

| Token | Value | Used by |
|---|---|---|
| `--duration-fast` / `--duration` | 150 / 220 ms | hover, tilt, sticky bar |
| `--duration-reveal` | 480 ms | reveal fallback transition, flip (half each way) |
| `--duration-hero` | 600 ms | hero entrance (upper bound) |
| `--duration-orbit` | 48 s | `Orbit` loop |
| `--ease-out` / `--ease-emphasis` | `cubic-bezier(.2,.7,.2,1)` / `cubic-bezier(.2,.8,.2,1)` | micro / reveal and hero |
| `--stagger` | 60 ms | sibling delay, multiplied by `--i` |
| `--reveal-y` | 16 px | reveal and hero travel |
| `--parallax-range` | 20 px | `Parallax` travel (±) |
| `--tilt-max` / `--tilt-perspective` | 6deg / 900 px | `TiltCard`, `FlipPreview` |

Policy:

- **Transform and opacity only**, with layout reserved (aspect ratios, `Parallax` padding, `Counter`
  `min-width` in `ch`). Never `will-change`, blur or drop-shadow keyframes.
- **Scroll-driven first.** `[data-reveal]` runs on a CSS view timeline (`entry 0%–35%`, staggered by
  `--i`), so an element already in view at load is at 100 % and never flashes. `RevealObserver` is
  only a fallback (`!CSS.supports("animation-timeline: view()")`): it marks elements *below the
  fold* with `data-reveal-state="pending"` and reveals them once. Nothing is hidden without JS.
- **Hero entrance** (`hero.css`): `[data-hero-enter]` rises ≤ 600 ms; `h1`/`title` and `media` never
  animate opacity (LCP paints at once). Do not combine with `data-reveal`.
- **Gates.** CSS: `prefers-reduced-motion: no-preference` around every animation, plus the global
  kill switch in `base.css`. JS: `useMotionOK()` (`useSyncExternalStore` over reduced motion,
  `(pointer: fine)` and `navigator.connection.saveData`) gates `TiltCard`, `Counter`, `FlipPreview`.
  Motion's `MotionConfig reducedMotion="user"` covers `m.*`. `Orbit` pauses under reduced motion.
- **Budget** (gzip, measured 2026-09-13): `src/motion` client JS 2.1 KB for TiltCard + Counter +
  FlipPreview + StickyCTA + `useMotionOK` (target ≤ 3 KB; RevealObserver adds ~0.4 KB to the layout
  chunk). Motion: `MotionProvider` (LazyMotion + MotionConfig) is **10.7 KB sync** — above the 5 KB
  target, it is the library's floor — plus **15.1 KB lazy** (`domAnimation`, target ≤ 15 KB). Mount
  `MotionProvider` only on routes that render `m.*`, import elements from `motion/react-m`
  (`import * as m`) and never `m`/`motion` from `motion/react` (+37 KB). Prefer the CSS-only pieces.
- No autoplaying video. Route budgets stay enforced by `npm run check:bundle`.

### Motion components (`src/motion`)

| Component | Kind | API |
|---|---|---|
| `reveal.css`, `hero.css`, `flip.css` | global CSS (imported by `base.css`) | `[data-reveal]` + `--i`; `[data-hero-enter]` / `="title"` / `="media"` + `--i`; view-transition class `pv-flip` |
| `RevealObserver` | client, root layout | no props; fallback only |
| `useMotionOK()` | hook | `{ ok, reducedMotion, finePointer, saveData }` |
| `TiltCard` | client | `children`, `className?`, `max?` (deg, defaults to `--tilt-max`), `as?: div\|article\|figure` |
| `Parallax` | server | `children`, `direction?: up\|down`, `className?` |
| `StickyStack` | server | `items: ReactNode[]` (≤ 6), `className?` — sticky cards; the previous card scales to .94 on the next card's view timeline (`timeline-scope`) |
| `Counter` | client | `value: number`, `format?: (n) => string`, `className?` — SSR renders the final value |
| `FlipPreview` | client | `front`, `back`, `showLabel?`, `hideLabel?`, `ratio?: 4/3\|3/4\|16/9`, `className?` — `<button aria-expanded>`, React `ViewTransition` |
| `WaveDivider` | server | `fill: WaveFill` (token name), `flip?`, `className?` |
| `Orbit` | server | `className?` — dashed ellipse + gold star on `offset-path` |
| `Universe` | server | `variant?: hero\|band`, `className?` — paint-contained backdrop that renders `Orbit` |
| `MotionProvider` | client | `children` — `LazyMotion` (lazy `domAnimation`) inside `MotionConfig reducedMotion="user"` |
| `StickyCTA` | client | `hideWhenVisible: string[]`, `label`, `children` — mobile only (`below("lg")`), hidden while any `dialog[open]` |

## Primitives (`src/components/ui`)

Server components, one folder each (`<Name>.tsx` + `<Name>.module.css`). Tones: `light|dark` for
text on navy; `SectionTone = cream|white|mint|sky|lemon|rose|navy`.

| Primitive | Props |
|---|---|
| `Section` | `tone?`, `id?`, `labelledBy?`, `label?`, `divider?: none\|wave-top\|wave-bottom\|overlap`, `dividerTone?: WaveFill` (neighbour band, default cream), `defer?` (`content-visibility: auto`; not with overlap), `container?` (default true), `className?`, `children` |
| `Card` | `variant?: default\|emphasis\|soft\|navy`, `pad?: md\|lg`, `as?: div\|article\|li\|section\|figure`, `id?`, `reveal?`, `stagger?` (`--i`), `className?`, `children` |
| `IconBadge` | `icon: IconName`, `size?: 48\|56\|72`, `tone?`, `number?`, `className?` |
| `Grid` | `cols?: 2\|3\|4`, `min?` (auto-fit column width), `gap?: 3\|4\|5\|6`, `as?: div\|ul\|ol` (lists get `role="list"`), `className?`, `children` — container queries at sm/md/lg |
| `Split` | `ratio?: 1/1\|1.1/0.9\|0.9/1.1\|1.2/0.8\|0.8/1.2`, `align?: start\|center\|stretch`, `stickyAside?`, `mediaFirstOnTablet?`, `className?`, `children: [copy, media]` — two columns from md (container), media first between sm and md |
| `Stack` | `gap?: 2\|3\|4\|5\|6`, `maxWidth?`, `align?: start\|center`, `as?`, `id?`, `className?`, `children` |
| `BulletList` | `items: string[]`, `icon?: IconName` (sparkles), `tone?`, `className?` |
| `ChipRow` | `align?: start\|center`, `className?`, `children` |
| `Eyebrow` | `tone?`, `as?: p\|span`, `className?`, `children` — replaces the global `.kicker` |
| `MediaFrame` | `ratio?: 4/3\|3/4\|16/9`, `elevation?: none\|sm\|md\|lg`, `tilt?`, `as?: div\|figure`, `className?`, `children` (img/picture/MediaImage) |
| `IconCardList` | `items: {icon,title,text}[]`, `cols?`, `numbered?` (`<ol>` + numbers), `tone?`, `className?` |
| `DecisionLink` (`src/features/commerce`) | `variant?`, `size?`, `block?`, `className?`, `children` — `<a href="#gfp-decision" data-decision-link>` with the `.button` classes |

`.container`, `.section`, `.section--*` and `.kicker` in `base.css` are legacy aliases kept until every
page renders `Section`/`Eyebrow`; remove them with the last page migration.

## Components

| Component | Kind | Notes |
|---|---|---|
| `PageShell`, `Header`, `Footer`, `Topbar`, `SkipLink` | server | complete navigation on every page; ≤ 4 header anchors, one CTA with a verb |
| `Universe` | server (CSS) | decorative starfield backdrop with `Orbit` |
| `SectionHeading`, `FactChip`, `TrustStrip`, `Steps`, `Notice`, `LegalLayout`, `Icon` | server | lucide icons through a small map |
| `MediaImage` | server | manifest-backed `<img srcset>` with explicit size, priority for LCP |
| `ResourceGrid` | server + `TiltCard` | real covers, names, page counts |
| `PageGallery` | client (Embla) | drag, arrows, dots, keyboard, counter, `<dialog>` zoom |
| `VideoBlock` | client | click-to-play with controls, one active player, text alternative |
| `PriceBlock` | server | price, tax/currency notes, CTA slot, guarantee; anchors only when real |
| `CheckoutLink`, `ProductInterestLink`, `ViewContentOnMount` | client | commerce islands (params + events) |
| `HotmartWidgetSlot` | client | single widget container, reserved height, focus target, fallback |
| `OfferModeRoot` / `OfferModeMirror` | server / client | pre-paint `data-offer`, post-hydration mirror |
| `StickyCTA` | client | mobile bar hidden over hero, final offer, footer and open dialogs |
| `ConsentBanner`, `Analytics`, `RevealObserver` | client | mounted once in the root layout |

## Responsive rules

1440/1280: two-column heroes, 3–4-up grids. 1024: two columns, 3-up grids. 768: single column,
2-up grids, visual above copy on the landing (`Split mediaFirstOnTablet`). 430/390/360: single
column, copy → price → CTA → visual, sticky bar on, 1-up cards; 360 shows the isotipo only in the
header. Reflow is checked at 320 in the nightly matrix; no page may scroll horizontally. Pages get
this from `Grid`/`Split` container queries; they do not write media queries.
