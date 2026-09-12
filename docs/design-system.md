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
| focus | navy 3 px ring + 2 px white halo | every focusable element | visible on all backgrounds |

Retired from the WordPress landings: `#df5a4f` (3.7:1), `#00a9a4` text (2.9:1), gold focus ring
(1.3:1), the purple downsell theme, Baloo 2, Roboto.

## Type

Fraunces (variable, 700) for display/H1/H2/price; Nunito Sans (variable, 500–800) for everything
else. Fluid scale via `clamp()`: H1 34→60, H2 30→42, lead 17→19, body 16→17, price 38→44.
Weights are capped at 800. Fonts are self-hosted (`src/fonts`, OFL) and loaded with
`next/font/local` (`display: swap`, metric-compatible fallbacks to limit CLS).

## Spacing, radius, elevation, motion

- 4-pt scale (`--space-1` … `--space-9`); section padding 56→96 px; container 1200 px with a
  20–24 px gutter; mobile gutter never below 20 px.
- Radius: 6 (chips), 8 (buttons, cards, media), 12 (large cards), pill only for chips.
- Elevation: three navy-tinted shadows plus a coral CTA glow. No backdrop blur.
- Motion: 150–250 ms ease-out; reveal-on-scroll ≤ 12 px, once (`RevealObserver`, only when JS
  runs); pointer tilt ≤ 6° on fine pointers only; slow orbit/float loops are decorative and every
  animation is disabled under `prefers-reduced-motion`. No autoplaying video.

## Components

| Component | Kind | Notes |
|---|---|---|
| `PageShell`, `Header`, `Footer`, `Topbar`, `SkipLink` | server | complete navigation on every page; ≤ 4 header anchors, one CTA with a verb |
| `Universe` | server (CSS) | decorative starfield/orbit backdrop |
| `SectionHeading`, `FactChip`, `TrustStrip`, `Steps`, `Notice`, `LegalLayout`, `Icon` | server | lucide icons through a small map |
| `MediaImage` | server | manifest-backed `<img srcset>` with explicit size, priority for LCP |
| `ResourceGrid` | server + `TiltCard` | real covers, names, page counts |
| `PageGallery` | client (Embla) | drag, arrows, dots, keyboard, counter, `<dialog>` zoom |
| `VideoBlock` | client | click-to-play with controls, one active player, text alternative |
| `PriceBlock` | server | price, tax/currency notes, CTA slot, guarantee; anchors only when real |
| `CheckoutLink`, `ProductInterestLink`, `ViewContentOnMount` | client | commerce islands (params + events) |
| `HotmartWidgetSlot` | client | single widget container, reserved height, focus target, fallback |
| `OfferModeRoot` / `OfferModeMirror` | server / client | pre-paint `data-offer`, post-hydration mirror |
| `StickyCTA` | client | mobile bar hidden over hero, final offer and footer |
| `ConsentBanner`, `Analytics`, `RevealObserver` | client | mounted once in the root layout |

## Responsive rules

1440/1280: two-column heroes, 3–4-up grids. 1024: two columns, 3-up grids. 768: single column,
2-up grids, visual above copy on the landing. 430/390/360: single column, copy → price → CTA →
visual, sticky bar on, 1-up cards; 360 shows the isotipo only in the header. Reflow is checked at
320 in the nightly matrix; no page may scroll horizontally.
