---
name: implement-page
description: Build or change a page of pequeverso.com following the design system, content model and commerce rules.
---

# Implement a page or component

1. Read `AGENTS.md`, the spec in `docs/specs/`, `docs/design-system.md` and `docs/content-model.md`.
2. Copy lives in `content/es/<page>.ts` (typed), facts in `config/`. Components are Server Components
   unless they need browser APIs; keep client islands small (`"use client"` at the leaf).
3. Use tokens from `src/styles/tokens.css` and CSS Modules. Every image needs `width`/`height`,
   descriptive Spanish `alt` (or `alt=""` when decorative) and a manifest record. Videos: poster,
   `playsinline`, `preload="metadata"`, controls or a visible pause, text alternative.
4. CTAs: principal → `buildCheckoutUrl` + `trackCheckoutIntent` (one event per click); post-purchase →
   scroll/focus the widget slot. Never add a direct upsell/downsell checkout link.
5. Run `npm run check`, then `npm run test:e2e -- --project=chromium-390 --project=chromium-1440`.
   Add or update a spec in `tests/e2e/` for every new behaviour.
6. In the PR body, list what was verified and what was not.
