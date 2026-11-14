# ADR-0014: Enforce the Content-Security-Policy, keeping inline scripts for now

Date: 2026-11-14 · Status: accepted (M3-5); revisited by the M5-9 hash spike · Related: owner
decision D-12 (`docs/master-plan/README.md`), ADR-0010, audit finding F-07

## Context

The site has sent `Content-Security-Policy-Report-Only` since launch, with `'unsafe-inline'` for
scripts and styles. A report-only policy protects nobody and nothing watches its reports. Next.js
App Router pages emit inline scripts (the flight-data bootstrap, `next/script` snippets, the offer
mode and JSON-LD blocks) whose content differs per route and per build.

The usual strict fix, a per-request nonce, needs a request-time API (middleware/`proxy.ts` and
dynamic rendering). AGENTS.md forbids both: every page is prerendered, so the same HTML serves the
static export parity build and the standalone server, and Cloudflare/Hostinger may serve it
without ever reaching Node.

## Decision

1. `config/edge-rules.json` sends an **enforced** `Content-Security-Policy` (same value on both
   targets, rendered to `.htaccess` and `next.config` `headers()`). The `-Report-Only` header is
   removed; two policies on the same response would only duplicate console noise.
2. `script-src` keeps `'unsafe-inline'` as a **documented compensating control**, together with an
   explicit host list: `'self'`, `https://checkout.hotmart.com`, `https://*.hotmart.com` (widget
   and checkout library), `https://connect.facebook.net` (`fbevents.js`, injected only after
   consent), `https://cloud.umami.is` (Umami, only when configured). No `'unsafe-eval'`, no
   `data:` or `blob:` scripts.
3. Everything else stays strict: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
   `frame-ancestors 'self'`, `font-src 'self'`, `form-action 'self' https://*.hotmart.com`,
   `frame-src` limited to Hotmart and Facebook, `connect-src` limited to the hosts above. The
   product-analytics origin (`docs/reference/site-analytics.md`) is appended to `connect-src` only for builds
   that enable it. The assistant API origin is not added: the assistant stays disabled
   (`docs/assistant.md` lists the one-line addition for the enabling change).
4. The **Cloudflare Web Analytics beacon is deliberately not allowed** (`static.cloudflareinsights.com`
   for the script, `cloudflareinsights.com` for the report). It is injected by the Cloudflare
   dashboard, not by the repository, it measures visitors before any consent choice, and PV-D9
   turns it off. Until the owner does that, browsers log one blocked-script CSP message per page
   and nothing else breaks. Re-allowing it would be a deliberate edit of this ADR and of the
   `/cookies/` table.
5. `img-src` keeps `https:` and `style-src` keeps `'unsafe-inline'` (Next and Hotmart inject
   styles; the pixel loads `https://www.facebook.com/tr`). They are low-risk residuals, not
   script-execution vectors.
6. Verification: `tests/unit/csp.test.ts` locks the policy contents; `tests/browser/csp.spec.ts`
   attaches the policy to every route and fails on any `securitypolicyviolation` or CSP console
   error (plus a negative control proving enforcement). Third-party hosts are unreachable in CI, so
   the first production deploy (M7) adds a manual check: open `/`, `/grafismo-fonetico/` and
   `/imprime-y-juega/` in a clean browser profile, accept consent, and confirm there is no CSP
   message other than the beacon.

## Consequences

- Residual risk: an injected inline script would execute (XSS). Mitigations: no user-generated
  content or reflected input on the site, `object-src 'none'`, `base-uri 'self'`, `form-action` and
  `frame-ancestors` restrictions, `X-Content-Type-Options: nosniff`, and the audited dependency
  set. The scorecard security axis stays at its floor until the hash spike lands.
- Rollback needs no git change: the build-time variable `CSP_MODE=report-only` (hPanel, then
  redeploy; `docs/deployment.md` "CSP rollback at M7") sends the same policy as
  `Content-Security-Policy-Report-Only` on both targets. The golden file and snapshot stay
  enforced. No browser keeps an enforced CSP across responses, unlike HSTS.
- Files served straight from `public/` by Hostinger's LiteSpeed (`/media`, `/fonts`, `/robots.txt`)
  do not pass through Next `headers()`, so they carry no CSP; they are not documents, so this does
  not weaken the document policy (`docs/verification/edge/2026-11-14-curl.md`).
- Hostinger adds its own `upgrade-insecure-requests` policy; the browser enforces both.

## Alternatives considered

- **Nonce per request.** Rejected: needs request-time rendering (AGENTS.md), defeats CDN caching.
- **Per-route script hashes now.** Deferred to M5-9 (a generated CSP hash file, build-time
  extraction, route-specific `headers()`): Next's inline bootstrap changes every build and the
  Hotmart and Meta snippets are third-party. If the spike works, `'unsafe-inline'` leaves
  `script-src`; if not, this decision stands.
- **Keep report-only.** Rejected: no reporting endpoint exists, so it gives no signal.
- **Allow the Cloudflare beacon.** Rejected for the consent reasons above.
