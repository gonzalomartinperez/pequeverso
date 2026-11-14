---
name: change-content
description: "Use when changing public Spanish copy, prices, guarantee wording or product facts on pequeverso.com, including requests like \"change the price\" or \"add a testimonial\". Not for adding testimonials, results or claims that have no source, nor for editing legal text or checkout configuration without the task naming them."
allowed-tools: Read, Grep, Glob, Edit, Bash
metadata:
  owner: gonzalomartinperez
  last-reviewed: "2026-11-14"
  version: "1.0.0"
---

# Change content

Copy lives in `content/es/*.ts` (typed); business facts live in `config/` (`config/commerce.ts`).
Rules and sources: `docs/content-model.md`. Owner decisions on copy: `docs/master-plan/owner-decisions.md`.

## Checklist

- [ ] Classify the request: copy (`content/es/`), fact (price, composition, guarantee period, checkout
  URL, social profile: `config/`), or legal text (needs the task to name it).
- [ ] A fact is changed once, in `config/`; copy reads it. Never type a price, period or URL into copy.
- [ ] A new price, guarantee or claim needs a value from the owner or from `docs/content-model.md`; if
  there is none, stop and ask. Never invent facts, testimonials, results, guarantees or numbers.
- [ ] A testimonial or result request is refused: point to the no-testimonials rule in `docs/content-model.md`
  and offer wording that makes no claim.
- [ ] Neutral Spanish addressing the reader as tú; consistent with the surrounding tone; no voseo.
- [ ] The change is on the owner approval list when it touches the hub lead, buy box microcopy,
  guarantee block, consent banner or FAQ: say so in the PR body.
- [ ] Run `npm test` (includes `tests/unit/content-invariants.test.ts`), `npm run check:placeholders`, `npm run lint`
  and `npm run typecheck`.

## Verify, fix, re-verify

If an invariant test fails, fix the copy or the config, not the test. Re-run the failing test, then the
whole set above.

## Output template

```
Changed: <file | field | old -> new>
Source of each fact: <config key or document>
Owner approval needed: <yes with item | no>   Verified: <commands>   Not verified: <list>
```

## Limits

- Not for invented proof, legal rewrites, checkout, tracking or layout changes.
- Do not edit `config/commerce.ts` or `content/es/legal/**` unless the task names them.
