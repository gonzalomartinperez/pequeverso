---
name: change-assistant
description: Change the native shopping assistant in src/features/assistant (UI, conversation state, SSE transport, contract pin) while keeping it disabled and compiled out of publishable builds. Not for enabling the assistant, API changes or deployment.
---

# Change the native assistant

Scope: `src/features/assistant/`, `content/es/assistant.ts`, `config/assistant.ts`,
`contracts/assistant-api/`, `tests/unit/assistant/`, `tests/assistant/`, `docs/assistant.md`.
Shared architecture checks also live in `tests/helpers/source-architecture.ts` and
`tests/unit/architecture.test.ts`; review their negative fixtures when a boundary changes.
Not in scope: enabling the assistant anywhere publishable, checkout/Hotmart/tracking/consent code,
the API repository, paid model calls, deployment.

## Invariants

- Disabled unless `NEXT_PUBLIC_ASSISTANT_ENABLED=true`; the inline comparison in `slot.tsx` keeps the
  code out of the default build. Never set it to `true` in `.env.example`, workflows or deploy paths.
- Layers: `domain` pure, `application` without React or browser globals, `adapters` only wired in
  `entry.ts`. The lazy `runtime.tsx` owns one stable controller; presentation receives it and
  imports application types only. Platform waits/deadlines are injected through ports. Check
  `tests/unit/assistant/boundaries.test.ts` and the transitive client graph, not just folder names.
- Untrusted input: API payloads are validated in `adapters/`; answers render as text only; every URL
  passes `domain/links.ts`; no HTML, no storage, no `window.open`, no automatic navigation.
- Contract: copy artifacts with `git show <committed API sha>:contracts/...` into
  `contracts/assistant-api/`, record the SHA and manifest hash in `source.json`, update
  `tests/assistant/api-revision`. New wire fields stay optional in validation.
- Design system: tokens, owned button variants, Base UI primitives, lucide icons; coral only for the
  purchase action and price; motion behind reduced-motion; no per-token announcements.

## Steps and evidence

1. Change the code; add or update unit tests for pure logic.
2. `npm run check:architecture`, then `npm run lint && npm run typecheck && npm test`.
   Exercise the real guards with forbidden-import fixtures. Temporary parser/linter probes must
   stay outside source roots so parallel tests cannot observe transient modules.
3. `npm run build && npm run check:assistant-disabled` (publishable build still has no assistant).
4. `ASSISTANT_API_DIR=<API checkout at tests/assistant/api-revision> npm run test:e2e:assistant`
   (fixture API, never a real key). Keep Playwright's package/browser revisions aligned; for local
   concurrent installs use `PLAYWRIGHT_SKIP_BROWSER_GC=1` or an isolated
   `PLAYWRIGHT_BROWSERS_PATH`, and reserve shared ports/cache leases before running. Open the screenshots in `test-results-assistant/screenshots/`
   and look at them; record representative ones in `docs/verification/assistant/`.
5. PR body: what was verified (commands, browsers) and what was not (real model, production
   origin/CORS/TLS, physical devices). A skill is a procedure, not an authorization.

## Limits

- Not an authorization to enable the assistant, publish an enabled build, use a real OpenAI key
  or change the API repository; each needs the owner's explicit, current approval.
- Evidence to report: `npm run check`, `npm run check:assistant-disabled`,
  `npm run test:e2e:assistant` results and the screenshots you inspected.
