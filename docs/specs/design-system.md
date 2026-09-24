# Spec: design system (Tailwind CSS v4 + shadcn/ui on Base UI)

**Status:** implemented on `feat/design-system` (foundation + shared layout). Product and legal
page redesigns follow in separate PRs on top of these primitives.
**ADR:** `docs/decisions/ADR-0006-shadcn-tailwind-design-system.md` · **Reference:** `docs/design-system.md`

## Outcome and scope

One place to change colour, type, spacing, radius and motion (`src/app/globals.css`), a
standard component vocabulary (shadcn/ui primitives + project blocks) and a performant,
accessible motion stack, so any page can be built or changed without writing new CSS.

In scope: tooling, tokens, primitives (`src/components/ui`), blocks (`src/components/blocks`),
motion utilities and the 3D scene skeleton (`src/motion`), the shared layout (PageShell, Header
with mobile Sheet, Footer, LegalLayout, consent banner styling, StickyCTA, 404, error,
global-error, `/soporte/`), tests, budgets and docs.
Out of scope: redesigning home, landing, offer, thanks and legal pages (they keep their CSS
Modules and render through the new blocks with the old props), copy, prices, commerce rules,
tracking logic, the Hotmart widget behaviour.

## Acceptance criteria

- **AC-1 Single token source.** Every colour, font, size, space, radius, shadow, easing,
  duration and layout constant lives in `globals.css` `:root`; `@theme inline` bridges them to
  utilities; `src/styles/*` is gone. Light theme only; no `!important` except the annotated
  reduced-motion kill switch. (unit: `design-system.test.mjs`)
- **AC-2 Contrast.** Colours are OKLCH equal to the previous sRGB values; the documented WCAG
  pairs are recomputed from the token source by a unit test.
- **AC-3 Primitives.** `src/components/ui` holds shadcn/ui (Base UI, `base-vega`) components
  adapted to tokens: kebab-case files, `data-slot` roots, cva variants, ≥ 44 px targets,
  visible focus. `buttonVariants`/`badgeVariants` live in server-safe modules.
- **AC-4 Blocks.** `src/components/blocks` replaces every PascalCase `ui/*` folder with the
  same public props, as server components.
- **AC-5 Motion.** transform/opacity only; CSS first (scroll-driven under `@supports` and
  `prefers-reduced-motion: no-preference`), React `<ViewTransition>` second, WAAPI section
  entrances third; decorative 3D only in the lazily imported `src/motion/scene` runtime with
  a server-rendered static fallback and a pause control (WCAG 2.2.2).
- **AC-6 Scene budget.** `scripts/check-scene-budget.mjs` proves the three + gsap closure is
  never in an initial chunk and ≤ 250 KB gzip; route JS does not count it.
- **AC-7 Responsive contract.** 320–1920 px: no horizontal overflow, no clipped control text,
  no stretched images, header CTA in the first viewport at ≤ 768 px, no fixed layer covering a
  checkout CTA at 640×360 (e2e: `responsive.spec.ts`, PR set; both engines nightly).
- **AC-8 Behaviour preserved.** Every id, `data-testid` and accessible name used by the e2e
  specs is unchanged; the PR set, the pixel-configured tracking/consent specs, axe and
  `check-rendered` pass.
- **AC-9 Budgets.** Route JS within the existing budgets (growth limited to the scene loader,
  page motion and the mobile-nav trigger); HTML/CSS re-baselined at measured + 10 % in ADR-0006.

## Design and decisions

- **Base UI, `base-vega` style.** Base UI is shadcn's default primitive library since July
  2026. Vega (the classic shadcn geometry) was chosen over Maia: the brand's warmth comes from
  the tokens (cream ground, Fraunces, coral pill CTA, 12 px cards, generous section padding);
  Maia's global rounding and spacing would fight the documented 4-pt scale and radius set.
  Radix is not mixed in.
- **Token architecture.** Three layers: brand raw tokens (`--pv-*`, OKLCH) → semantic roles
  (`--primary` coral CTA, `--secondary` navy, `--accent` teal/turquoise, `--heading`, `--body`,
  `--chip`, `--icon`, `--ring`…) → `@theme inline` utilities (`bg-primary`, `text-heading`,
  `bg-navy`, `text-h2`, `rounded-lg`, `shadow-cta`, `ease-emphasis`). `on-navy` / `on-light`
  re-scope the roles for a subtree, so blocks adapt to their band without tone props.
- **Class merging.** `cn` runs on merge tables compiled from the sources by `cn build`
  (`withCn` in `next.config.mjs`, output gitignored); client islands outside `ui/` join classes
  with `cx` (0.2 KB) or receive server-computed class strings.
- **Container queries.** Blocks adapt to their container (`cq` + `cq-sm…cq-xl`, thresholds
  = the sm/md/lg/xl breakpoints); pages never write media queries.

## File conventions

`src/components/ui/<name>.tsx` (shadcn primitive, may be client), `ui/<name>-variants.ts`
(server-safe cva), `src/components/blocks/<name>.tsx` (server block), `src/components/layout/`
(shell), `src/motion/<name>.tsx` + `motion.css`, `src/motion/scene/` (lazy 3D). Exports carry a
one-line JSDoc; no narrative comments. CSS Modules may remain only for custom geometry and
use `var(--token)` (never `@apply`).

## Migration plan for the follow-up PRs

1. **Home + landing (3D hero).** Replace `HeroScene.module.css`/`HeroStack.module.css` with
   blocks + utilities; build the "pequeño universo" hero on `SceneStage` (extend
   `scene-runtime.ts`: planets, orbiting gold star, scroll parallax; keep the static fallback
   in sync; stay within `scene.js`). Delete `page.module.css`, `CoreLanding.module.css`, the
   `core/*.module.css` files; use `FAQ`, `PriceBlock`, `Split`, `Grid`, `Steps`.
2. **Offer + thanks.** Same for `OfferLanding`, `ThanksPage`, `offer/*`; the Hotmart slot keeps
   one `#hotmart-sales-funnel` container.
3. **Gallery/video/age selector.** Restyle with utilities; the age selector may move to
   `RadioGroup variant="chip"` if the `ViewTransition` behaviour is kept.
4. **Legal pages.** Use `Table` for data tables inside `prose`.
5. Each PR: delete its CSS Modules, tighten `config/budgets.json` (css budgets fall to the
   global stylesheet, ≈ 12.5 KB), update visual baselines on Linux.

## Verification

`npm run check` (lint, types, unit, knip, build, media, placeholders, bundle, scene,
rendered); `PORT=3230 npm run test:e2e`; a build with `NEXT_PUBLIC_META_PIXEL_ID` plus
`E2E_EXPECT_CONSENT=1` for `tracking|consent|a11y|responsive`. Visual baselines are
regenerated on Linux by the nightly workflow (not committed from Windows).
