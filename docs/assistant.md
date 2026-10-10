# Native shopping assistant

Advisory, read-only helper that answers questions about the store's products with data from
`pequeverso-assistant-api`. It **ships disabled** and is not authorized for activation. Decision:
`docs/decisions/ADR-0008-native-assistant.md`.

## State

| Item | Status |
|---|---|
| Code in `src/features/assistant/` (domain, application, adapters, presentation, entry) | Implemented |
| Default build (`npm run build`) | Disabled and compiled out; verified by `npm run check:assistant-disabled` |
| Enabled verification build against the fixture API | Implemented: `npm run test:e2e:assistant` (never publish) |
| Real model (`gpt-6-luna`), production API, hostname, CORS in production | **Not** done: owner authorization pending |
| Privacy-policy section for the assistant | **Not** written in `/privacidad/`: required before activation |

## Switch

| Variable | Values | Effect |
|---|---|---|
| `NEXT_PUBLIC_ASSISTANT_ENABLED` | unset, empty, `false` | Disabled: no launcher, panel, session or API request; no assistant code in the output |
| | `true` | Enabled (requires the origin below) |
| | anything else | Build fails (`check-env`), value not printed |
| `NEXT_PUBLIC_ASSISTANT_API_ORIGIN` | bare `https://host` | API origin the browser calls (`/api/v1/...`) |
| `ASSISTANT_LOCAL_TEST_BUILD` | `true` | Allows `http://localhost` / `127.0.0.1` origins for local verification only |

`config/next.ts` always defines the switch (normalized to `"true"`/`"false"`) so the bundler can drop
the assistant code even when the variable is absent; Next only inlines `NEXT_PUBLIC_*` variables that
exist in the build environment. `npm run build` ends with the publish guard (`check-assistant-disabled`;
an explicitly enabled verification build only warns), CI runs it strictly, and
`npm run check:assistant-absent-build` rebuilds with the variable absent from a minimal environment.
`NEXT_PUBLIC_*` values are inlined at build time. Turning the assistant on or off in the static
export therefore **requires a rebuild and a release**; vps-ops cannot switch it at runtime. Stopping
the API alone leaves the launcher visible but harmless: the panel shows an offline notice with a
link to Soporte and the store keeps selling.

## API requirements for activation (cross-origin)

The store is a static site on its own origin; the API is a separate HTTPS origin.

- `ALLOWED_ORIGINS` on the API lists exactly the store origin (`https://pequeverso.com`; `www`
  redirects to the apex, so it is not added). No wildcard, no `null`.
- CORS: credentials allowed; allowed headers `Content-Type`, `X-CSRF-Token`, `Idempotency-Key`;
  exposed `X-Run-ID`, `Retry-After`; preflight cached ≤ 10 min.
- Cookie: host-only `__Host-pv_assistant`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`; never a
  `Domain` cookie and never `SameSite=None`. It works only while the API host is same-site with the
  store (a subdomain of `pequeverso.com`). A different registrable domain would make it a third-party
  cookie and break sessions in Safari and Firefox.
- CSRF: token from `POST /api/v1/session`, kept in memory only, sent as `X-CSRF-Token`; the API also
  checks `Origin` on every mutation.
- Proxy (vps-ops): preserve `/api` paths, do not buffer `text/event-stream`, keep idle timeouts above
  the API's 15 s heartbeat and 45 s run deadline, never cache API responses.
- Store CSP (`config/edge-rules.json`, report-only today) must add the approved API origin to
  `connect-src`. It is not added now because no hostname is approved.

## Behaviour

- Launcher bottom-right (above the mobile sticky purchase bar). Compact desktop panel: a named,
  non-modal **region**; the page stays usable. Expanded (in-page) and phone surfaces (portrait and
  landscape): **modal dialog**, background `inert`, page scroll locked, Tab contained, store motion
  held. Escape (after any open confirmation consumes it) or "Minimizar" hides the panel and returns
  focus to the launcher; the conversation and an answer in progress continue while hidden, and the
  launcher marks a new answer.
- Phones: the surface follows the VisualViewport (on-screen keyboard, pinch-zoom, a page wider
  than the screen) with safe-area padding for the composer.
- Motion: one avatar tilt on hover/focus with a fine pointer; nothing under reduced motion. While a
  modal surface covers the page, `src/motion/motion-hold.ts` pauses the WebGL scene and CSS motion
  under the page landmarks and defers a cold WebGL start; releasing it restores the visitor's own
  pause choice untouched.
- Retry and Idempotency-Key: a retry is always an explicit click. After a **failure or a
  cancellation** it sends a new key. After an **interruption** (the connection ended without a
  terminal event) it first resends the **same** key and body: if the API had completed and stored
  the answer, it replays it without a new model call or cost; if that run ended failed or
  cancelled, the API answers `409 idempotency_conflict` and the client retries once with a fresh
  key. The question bubble is never duplicated. This deliberately refines the API handoff's
  "retry with a new key" for the interrupted case (`application/assistant.ts`, `retry`).
- A streamed draft is labelled "en curso" until the API confirms the stored answer; a cut stream is
  labelled incomplete with an explicit retry. Nothing is retried automatically.
- States: `initializing`, `ready`, `submitting`, `streaming` (`stopping`), `completed`, `cancelled`,
  `failed` (always recoverable), `unavailable`, `expired` (`domain/conversation.ts#phase`).
- Stacking: an open panel sits above the cookie-consent banner, so its composer is never covered.
  The banner stays usable while the panel is compact or minimized and returns intact after an
  expanded or phone (modal) panel closes.
- Answers render as text (bold and lists only, no HTML, no auto-links). Product cards, prices (only
  with their confirmation date), resources, sources, links and follow-ups come from validated API
  fields; URLs pass `domain/links.ts` (backslashes, control characters and `//` paths are refused, so
no storefront link can become protocol-relative) (store origin, plus `consumer.hotmart.com` and
  `refund.hotmart.com` for links). Store links navigate in the same tab without reloading; external
  links open in a new tab only on click. The assistant never navigates or opens windows on its own.
- Language: the interface is Spanish; the API answers in Spanish or English per message and the
  answer carries its `lang`. Other languages get a short note listing both.
- No tracking, analytics or replay. Nothing is stored in the browser except the API's HttpOnly
  cookie.

## Verification

| Command | Proves |
|---|---|
| `npm test` | Flag parsing, reducer and phases, controller, SSE framing (split UTF-8, CRLF, comments, multiline, bounds, order, early EOF, stall, abort), validation, link policy, contract pin, boundaries |
| `npm run build && npm run check:assistant-disabled` | The publishable export has no assistant code |
| `npm run test:e2e -- --project=chromium-1440` (`assistant-disabled.spec.ts`) | Real disabled export: no launcher, no assistant script, no request outside the known hosts |
| `ASSISTANT_API_DIR=<api checkout at tests/assistant/api-revision> npm run test:e2e:assistant` | Enabled build + real fixture API, both over **HTTPS loopback** (throwaway self-signed certificate made with the system `openssl`, a test prerequisite, accepted only by the test servers and Playwright), in Chromium desktop/phone/reduced-motion, Firefox and WebKit desktop/phone: Secure HttpOnly `__Host-` session cookie with credentialed CORS and CSRF, ask, SSE stream, stop, minimize while streaming, keyboard and Escape, region vs modal semantics with inert background and contained Tab, motion hold, phone geometry, client navigation and reload history, English, delete with confirmation, 200 % text and long text, API outage, axe |

Measured results, bundle impact and screenshots: `docs/verification/assistant.md`.

Not verified here: the real model's answers, production TLS/DNS/proxy/CORS between two different
hosts (on loopback both origins share the host `127.0.0.1`, so the cookie jar is shared across ports),
physical phones and keyboards, screen readers beyond axe and keyboard checks, and field Core Web
Vitals.

Known store issue found while testing (not changed here): with the root font forced to 200 %, the
home hero overflows horizontally on phones. The assistant surface itself fits.
