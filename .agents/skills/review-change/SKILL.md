---
name: review-change
description: Review a pull request of pequeverso.com for commerce safety, accessibility, performance and public-repo hygiene.
---

# Review a change

Check, in this order, and cite file paths:

1. Commerce safety: checkout URL comes from config; `off`/`ref` never forwarded; exactly one Hotmart
   widget container on post-purchase pages; no `InitiateCheckout`/`Purchase` on the site; no invented
   claims, testimonials, guarantees, prices.
2. Public-repo hygiene: no secrets, no originals or PDFs, every `public/media` file in
   `media/manifest.json` with rights = `public-repo-approved`, budgets respected.
3. Accessibility: one `h1`, landmarks, focus visible, contrast (tokens only), 24 px targets, reduced
   motion honoured, media alternatives.
4. Performance: LCP element has priority and explicit size, everything else lazy, no layout shift from
   the widget slot or fonts, no new dependency without justification.
5. Both targets: nothing that breaks `output: 'export'` or `standalone`; edge rules only in
   `config/edge-rules.json`; golden `.htaccess` updated.
6. Tests: the behaviour is covered by unit or Playwright tests; CI is green; PR body states what was
   not verified.
