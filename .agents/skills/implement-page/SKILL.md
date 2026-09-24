---
name: implement-page
description: Build or change a page of pequeverso.com following the design system, content model and commerce rules.
---

# Implement a page or component

1. Read `AGENTS.md`, the spec in `docs/specs/`, `docs/design-system.md` (tokens, primitives,
   blocks, motion, responsive contract) and `docs/content-model.md`.
2. Copy lives in `content/es/<page>.ts` (typed), facts in `config/`. Components are Server
   Components unless they need browser APIs; keep client islands small (`"use client"` at the leaf).
3. Compose from `src/components/blocks` (Section, SectionHeading, Stack, Grid, Split, PriceBlock,
   CTAButton, FAQ, …) and `src/components/ui` (shadcn/ui on Base UI). Style with Tailwind
   utilities over the roles in `src/app/globals.css` (`text-heading`, `text-body`, `bg-navy`,
   `text-h2`, `rounded-lg`, `shadow-md`, `cq-md:grid-cols-2`); never hard-code colours, sizes or
   media queries. Navy bands get `Section tone="navy"` (roles re-scope via `on-navy`; light cards
   inside use `on-light`). Links styled as buttons use `CTAButton` or `buttonVariants()`; coral
   `primary` is only for the purchase action. New files are kebab-case with `data-slot` roots.
   A CSS Module is allowed only for custom geometry and uses `var(--token)`, never `@apply`.
4. Motion: `data-reveal` + `--i`, `data-hero-enter`, motion components from `src/motion`; 3D only
   through `src/motion/scene` (lazy, static fallback, pause control, `npm run check:scene`).
   Transform/opacity only; everything must be fine under reduced motion.
5. Media: every image needs `width`/`height`, Spanish `alt` (or `alt=""` when decorative) and a
   manifest record (`MediaImage`). Videos: poster, `playsinline`, `preload="metadata"`, controls
   or a visible pause, text alternative.
6. CTAs: principal → `CheckoutLink` (`buildCheckoutUrl` + one `trackCheckoutIntent` per click);
   post-purchase → `DecisionLink` to the widget slot. Never add a direct upsell/downsell checkout link.
7. Responsive: check 320–1920 px (no overflow, targets ≥ 44 px, header CTA visible at ≤ 768 px).
8. Run `npm run check`, then `npm run test:e2e` (includes `responsive.spec.ts`). Add or update a
   spec in `tests/e2e/` for every new behaviour; tighten `config/budgets.json` when CSS Modules go.
9. In the PR body, list what was verified and what was not.
