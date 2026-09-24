# ADR-0006: Tailwind CSS v4 + shadcn/ui (Base UI) design system

Date: 2026-09-24 · Status: accepted

## Context

The site was styled with hand-written CSS Modules over `src/styles/tokens.css`, `base.css` and
`utilities.css`, plus global `.button--*`, `.kicker`, `.lead` and `.container` classes. Tokens
were centralised but components were not: every primitive re-implemented its variants, the
button styles lived in a global sheet used by class-name strings, and adding a dialog, tabs or a
mobile menu meant building accessibility behaviour from scratch. The owner asked for a
standardised, centralised system that anyone (or any agent) can change autonomously, with
spectacular but performant motion and a full-responsive guarantee.

## Decision

1. **Tailwind CSS 4.3** (`@tailwindcss/postcss`, exact pins) with a single token file,
   `src/app/globals.css`: raw OKLCH brand tokens (`--pv-*`) → semantic roles (shadcn names plus
   `--heading`, `--body`, `--chip`, `--icon`, `--link`) → `@theme inline` utilities. `inline`
   because the roles are re-scoped per subtree (`on-navy`, `on-light`) and must resolve where
   used; `--color-*: initial` removes Tailwind's palette so only brand colours exist.
2. **shadcn/ui on Base UI, style `base-vega`.** Base UI is shadcn's default since July 2026.
   Vega keeps shadcn's neutral geometry; the warmth comes from the tokens (cream, Fraunces, coral
   pill CTA, 12 px cards). Maia's global rounding and spacing would override the documented
   scale, so it was rejected. Radix is not mixed in. Primitives are generated with the CLI and
   restyled; provenance in `docs/assets/shadcn-ui.md`.
3. **Light theme only.** The brand is a cream page with navy bands; a dark theme would double the
   contrast surface for no user demand. No `.dark`, no dark variant.
4. **Server-first.** Blocks are server components; `buttonVariants`/`badgeVariants` live in
   server-safe modules so links styled as buttons ship no client code. Always-loaded client
   islands (consent banner, mobile-nav trigger) receive server-computed class strings; client
   code outside `ui/` joins classes with `cx`. `cn` (shadcn's Sept 2026 package) runs on merge
   tables compiled from the sources by `cn build` (`withCn`), 3.2 KB instead of the full table.
5. **Motion layers.** CSS first (scroll-driven reveals under `@supports (animation-timeline:
   view())`, Base UI transitions on `data-starting-style`/`data-ending-style`), React
   `<ViewTransition>` second, WAAPI section entrances third. **three + gsap only for the hero
   scene**, lazily imported in an effect behind reduced motion, Save-Data and short-viewport
   gates, with a server-rendered static SVG fallback and a pause control; the pattern and the
   webpack scene-budget plugin come from the owner's portfolio.
6. **Responsive contract** as an acceptance criterion (`docs/design-system.md`), enforced by
   `tests/e2e/responsive.spec.ts` at 320–1920 px on both engines.

## Budgets

Measured on the static export against `origin/main` at the time (gzip):

| Route | html main → branch | js main → branch | css main → branch |
|---|---|---|---|
| `/` | 20.4 → 24.3 KB | 147.4 → 150.0 KB | 13.2 → 16.0 KB |
| `/grafismo-fonetico/` | 39.8 → 45.0 KB | 162.1 → 163.7 KB | 13.2 → 16.0 KB |
| `/imprime-y-juega/` | 27.1 → 31.1 KB | 162.1 → 163.7 KB | 13.2 → 16.0 KB |
| `/grafismo-fonetico/gracias/` | 18.5 → 22.2 KB | 143.1 → 144.5 KB | 13.2 → 12.3 KB |
| `/soporte/` | 9.9 → 11.3 KB | 141.4 → 142.5 KB | 13.2 → 12.1 KB |
| scene closure (deferred) | — | 177.6 KB, never initial (budget 250 KB) | — |

- **JS** stays inside the existing budgets; the +1.1–2.6 KB is the scene loader, `PageMotion`
  and the mobile-nav trigger (requested features). three + gsap are excluded from route JS and
  bounded by `scene.js`.
- **HTML** grows 1.4–5.2 KB: utility class strings are repeated in the RSC payload and the new
  structure adds `data-slot`/scene markup. Budgets are re-baselined at measured + 10 % (this ADR
  is the required decision record). Page redesigns should recover part of it.
- **CSS**: one global stylesheet (≈ 12.1–12.6 KB) replaces three global sheets plus per-route
  modules. Product pages still load their legacy modules (16.0 KB total) until they migrate; the
  follow-up PRs must lower their `css` budgets to the global size.

### Addendum 2026-09-24 — home and landing redesign

The home/landing redesign deleted their CSS Modules (gallery, video, age selector, hero scene,
hero stack, core blocks, `page.module.css`); with the offer/legal redesign (#45) no route loads a
module any more, so every route serves only the global stylesheet: 15.3 KB gzip (12.1 KB at the
foundation; the utilities replace ~4 KB of per-route modules). `/` falls from 16.0 to 15.3 KB and
`/grafismo-fonetico/` from 16.0 to 15.3 KB. Following the rule (measured + 10 %), one `css`
budget of 17 238 B now applies to every route (`default.css`; the per-route css overrides are
removed). JS: `/` 150.0 → 150.2 KB, landing 163.7 → 163.3 KB; scene closure 181.1 KB (budget
250 KB, gsap core ≈ 19.5 KB + ScrollTrigger ≈ 17 KB inside, never initial). HTML stays within
the existing budgets (`/` 26.8 KB, landing 49.3 KB).

### Addendum 2026-09-24 — Argentine legal re-anchoring

The footer now carries the seller identification (Res. SCI 270/2020) and the "Botón de
arrepentimiento" link (Disp. SSDCyLC 954/2025) on every page, and the legal pages were rewritten
with numbered sections and Argentine sources. Measured html (gzip level 9) and new budgets at
measured + 10 %: `/` 27 773 B → 30 550 B, `/grafismo-fonetico/` 51 215 B → 56 337 B, `/terminos/`
21 413 B → 23 554 B, `/privacidad/` 20 901 B → 22 991 B, and the new `/arrepentimiento/` 23 747 B
(per-country table) → 26 122 B. JS and CSS unchanged.

## Consequences

- One file changes the brand; semantic roles make blocks adapt to their band without tone props.
- Accessible dialog, sheet, accordion, tabs, radio group and tooltip come from Base UI.
- Product pages keep CSS Modules until their redesign PRs; modules may not use `@apply`
  (unit-tested) and must reference tokens through `var()`.
- `src/lib/cn-tables.js` is generated before every dev/build/typegen and is gitignored.
- Visual baselines must be regenerated on Linux after merge.

## Sources

- shadcn/ui changelog — "July 2026 – Base UI as the Default", "September 2026 – cn":
  https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default, https://ui.shadcn.com/docs/changelog
- shadcn component styles (Vega, Maia, …): https://www.shadcnblocks.com/blog/shadcn-component-styles-vega-nova-maia-lyra-mira
- `cn` build setup (compiled merge tables): https://github.com/shadcn-ui/cn/blob/main/docs/build-setup.md
- Tailwind CSS v4 theme variables (`@theme inline`, namespace reset): https://tailwindcss.com/docs/theme
- Base UI animation handbook (`data-starting-style` / `data-ending-style`, transitions over keyframes): https://base-ui.com/react/handbook/animation
- MDN scroll-driven animations (`view()`, `animation-range`): https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- WCAG 2.2 SC 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- WCAG 2.2 SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Owner's portfolio (read-only reference): `hero-stage.tsx`, `scene-runtime.ts`, `page-motion.tsx`,
  `scripts/scene-budget-plugin.mjs`, `scripts/budget.test.mjs`, `components.json`, `src/components/ui/*`.
