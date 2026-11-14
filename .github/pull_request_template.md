## What

<!-- What changes. Link the roadmap task, spec or issue when there is one. -->

## Why

<!-- The problem or decision behind the change. -->

## Evidence

<!-- Commands run and their result (e.g. `npm run check`, `npm run test:browser` projects).
     Add screenshots for UI changes (1440 / 1280 / 1024 / 768 / 430 / 390 / 360 where visual). -->

## Not verified

<!-- Be explicit: what this PR does NOT prove (e.g. real Hotmart purchase, production deploy, field CWV). -->

## Risk

<!-- Blast radius. Commerce, tracking, consent or legal impact: None / describe and link the decision. -->

## Rollback

<!-- How to undo (usually: revert this PR). Note anything a revert does not undo. -->

## Checklist

- [ ] `npm run check` passes locally
- [ ] Keyboard, focus and reduced-motion reviewed (where the change is interactive)
- [ ] Hotmart still owns payment, delivery and refunds; no `InitiateCheckout` or `Purchase` event
- [ ] Prices, guarantee, checkout URL and other facts come from `config/`, not copy
- [ ] Static export and `NEXT_OUTPUT=standalone` both still build
- [ ] The native assistant stays disabled (`npm run check:assistant-disabled`)
- [ ] No secrets, originals, product files or customer data committed
