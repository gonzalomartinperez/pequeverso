---
name: audit-accessibility
description: "Use when auditing or verifying accessibility of pequeverso.com pages (axe, keyboard path, reduced motion, text zoom, targets) before or after a UI change. Not for fixing visual design, performance work, or editing the third-party Hotmart iframe."
allowed-tools: Read, Grep, Glob, Bash
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Audit accessibility

Bar: WCAG 2.2 AA (`AGENTS.md`): contrast, visible focus, targets of at least 24 px, reduced motion,
text alternatives. The current baseline is `ratchets/a11y.json`.

## Checklist

- [ ] List the routes in scope (default: the routes in `tests/browser/a11y.spec.ts`).
- [ ] Automated: `npm run test:browser -- tests/browser/a11y.spec.ts` (axe, reduced motion).
- [ ] Zoom and reflow: `npm run test:browser -- tests/browser/text-zoom.spec.ts`.
- [ ] Reduced motion: `npm run test:browser -- tests/browser/motion.spec.ts`.
- [ ] Keyboard by hand: tab order follows the visual order, focus ring visible on every control, no
  trap, the cookie banner and the checkout CTA reachable and operable with Enter/Space.
- [ ] One `h1`, landmarks present, every image has Spanish `alt` or `alt=""` when decorative,
  videos have captions or a text alternative.
- [ ] Use the isolated Playwright Chromium only; never a personal browser profile.

## Hotmart iframe exception protocol

The Hotmart widget (`docs/hotmart-funnel.md`) renders a third-party iframe we cannot edit. Findings
inside it (for example frame-title or link-name) are recorded, not "fixed" in the iframe: confirm the
violation is inside the iframe, keep the count within `ratchets/a11y.json`, and note it as a known
exception. Anything on our side of the iframe (container, label, focus entry and exit) is in scope.

## Verify, fix, re-verify

Reproduce each violation (rule id, selector, route, viewport), fix it in our code, re-run the same spec,
then run `npm run lint && npm run typecheck && npm test`. Stop after three failed attempts and report.

## Output template

```
Routes and viewports: <list>
Violations: <rule id | selector | route | viewport | fixed or exception>
Manual checks: keyboard <pass|fail>, zoom <pass|fail>, reduced motion <pass|fail>
Hotmart iframe exceptions: <count and rules>   Not verified: <screen reader, devices>
```

## Limits

- Not for visual redesign, performance tuning, or changing the Hotmart iframe or its script.
- A passing axe run is not proof of accessibility: say what was not checked.
