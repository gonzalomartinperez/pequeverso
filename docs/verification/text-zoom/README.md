# Text enlargement verification — 2026-10-10

At root font size200%, all13routes reflow at320/390CSSpx in Chromium,Firefox and WebKit. This tests text enlargement in the rem-based stylesheet; it is not a complete WCAG certification or a real-device/browser-menu audit. No hiding overflow was added to mask content.

The original commit8a205fe was unverified and failed the resumed route checks. Its `text-*.webp` images are preliminary historical captures, not final acceptance evidence. Independent inspection found a floating offer occupying almost the viewport despite horizontal checks passing; the corrected offer gives its summary and action separate rows. Its active state now has a height/visibility/overflow regression test. A second finding corrected the closing price grid in all three engines.

Verified locally after clean locked installation: npm run check, check:assistant-disabled (127 files without assistant code), skills and media types. All39route/engine cases pass; the three active-offer cases pass after the scroll driver uses native instant scrolling instead of waiting for a reveal target to become stable. The previous failed WebKit stability wait remains in the task evidence. Normal Chromium390/768/1440 smoke, axe and responsive tests:95passed,28expected skips. Full PR CI remains a merge prerequisite.

## Inspected before and after

Before screenshots use the development export at8f36e1e; after screenshots use the verified UI candidate. The publishable assistant is disabled in both. These are local fixture builds, not production screenshots. Viewport captures scroll to both text and media and decode lazy images before capture; a full-section capture could omit offscreen deferred paint and is not used for acceptance.

| Viewport | Before text | After text | Before media | After media |
|---|---|---|---|---|
| 390px | [before](before-verified-normal-390-closing-top.png) | [after](after-verified-normal-390-closing-top.png) | [before](before-verified-normal-390-closing-media.png) | [after](after-verified-normal-390-closing-media.png) |
| 768px | [before](before-verified-normal-768-closing-top.png) | [after](after-verified-normal-768-closing-top.png) | [before](before-verified-normal-768-closing-media.png) | [after](after-verified-normal-768-closing-media.png) |
| 1440px | [before](before-verified-normal-1440-closing-top.png) | [after](after-verified-normal-1440-closing-top.png) | [before](before-verified-normal-1440-closing-media.png) | [after](after-verified-normal-1440-closing-media.png) |

At normal320px the secondary closing product link can wrap onto two lines; the label remains complete. Primary checkout/hero labels retain their responsive checks. The requested390/768/1440 comparisons preserve the layout.

| Text200% | Closing before | Closing after | Active offer after |
|---|---|---|---|
| 320px | [before](before-final-zoom-320-closing.png) | [after](after-final-zoom-320-closing.png) | [offer](after-corrected-zoom-320-sticky.png) |
| 390px | [before](before-final-zoom-390-closing.png) | [after](after-final-zoom-390-closing.png) | [offer](after-corrected-zoom-390-sticky.png) |

## Repeat from a clean checkout

Use the fixture values from .env.example, with NEXT_PUBLIC_ASSISTANT_ENABLED=false.

```bash
nvm use
npm ci
npm ci --prefix tools/media --ignore-scripts
npx playwright install --with-deps chromium firefox webkit
npm run check
npm run check:assistant-disabled
npm run check:skills
npm run typecheck:media
npm run test:e2e -- tests/e2e/text-zoom.spec.ts --project=chromium-390 --project=firefox-390 --project=webkit-390
npm run test:e2e
```

No real purchases, paid provider calls, live OAuth, deployment or field Core Web Vitals are demonstrated by these captures. Checkout, tracking and consent logic were not changed.
