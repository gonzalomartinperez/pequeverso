---
name: change-assistant
description: Change the native shopping assistant in src/features/assistant (UI, conversation state, SSE transport, contract pin) while keeping it disabled and compiled out of publishable builds.
---

# Change the native assistant

Scope: `src/features/assistant/`, `content/es/assistant.ts`, `config/assistant.ts`,
`contracts/assistant-api/`, `tests/unit/assistant/`, `tests/assistant/`, `docs/assistant.md`.
Not in scope: enabling the assistant anywhere publishable, checkout/Hotmart/tracking/consent code,
the API repository, paid model calls, deployment.

## Invariants

- Disabled unless `NEXT_PUBLIC_ASSISTANT_ENABLED=true`; the inline comparison in `slot.tsx` keeps the
  code out of the default build. Never set it to `true` in `.env.example`, workflows or deploy paths.
- Layers: `domain` pure, `application` without React or browser globals, `adapters` only wired in
  `entry.ts`, presentation never imports adapters (`tests/unit/assistant/boundaries.test.ts`).
- Untrusted input: API payloads are validated in `adapters/`; answers render as text only; every URL
  passes `domain/links.ts`; no HTML, no storage, no `window.open`, no automatic navigation.
- Contract: copy artifacts with `git show <committed API sha>:contracts/...` into
  `contracts/assistant-api/`, record the SHA and manifest hash in `source.json`, update
  `tests/assistant/api-revision`. New wire fields stay optional in validation.
- Design system: tokens, owned button variants, Base UI primitives, lucide icons; coral only for the
  purchase action and price; motion behind reduced-motion; no per-token announcements.

## Steps and evidence

1. Change the code; add or update unit tests for pure logic.
2. `npm run lint && npm run typecheck && npm test`.
3. `npm run build && npm run check:assistant-disabled` (publishable build still has no assistant).
4. `ASSISTANT_API_DIR=<API checkout at tests/assistant/api-revision> npm run test:e2e:assistant`
   (fixture API, never a real key). Open the screenshots in `test-results-assistant/screenshots/`
   and look at them; record representative ones in `docs/verification/assistant/`.
5. PR body: what was verified (commands, browsers) and what was not (real model, production
   origin/CORS/TLS, physical devices). A skill is a procedure, not an authorization.
