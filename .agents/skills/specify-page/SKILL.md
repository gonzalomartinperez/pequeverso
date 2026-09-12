---
name: specify-page
description: Write a short spec before building or redesigning a page or section of pequeverso.com.
---

# Specify a page or section

1. Copy `docs/specs/template.md` to `docs/specs/<slug>.md`.
2. State the central idea of the page (what the visitor must understand and do) and the single
   primary action. Post-purchase pages have the Hotmart widget as the only decision.
3. List sections in order with purpose, copy source (`content/es/*`), media (from `media/manifest.json`)
   and observable behaviours (CTA targets, events, offer modes, fallbacks).
4. Define acceptance: responsive widths (1440/1280/1024/768/430/390/360), keyboard path, contrast,
   reduced motion, CLS, media loading, and which Playwright spec covers each behaviour.
5. Call out anything that needs an owner decision (price, guarantee, claims, rights) instead of guessing.
