# ADR-0008: Native shopping assistant, disabled by default, on a separate API origin

Date: 2026-10-05 · Status: accepted (implementation); activation **not** authorized

## Context

Pequeverso has an advisory shopping assistant backend (`pequeverso-assistant-api`, FastAPI, fixture
provider by default, OpenAI `gpt-6-luna` only with owner authorization). Its conversation UI lived in
a separate app (`pequeverso-assistant-web`) meant to be framed by the store. The owner decided that
the store is the only public conversation surface, rendered natively (no iframe), and that the
separate app becomes a private backoffice. The store is a static export on Hostinger with no
request-time code; the assistant API will run on the VPS behind vps-ops' proxy.

## Decision

- **One public implementation** in `src/features/assistant/`, moved from `pequeverso-assistant-web`
  (same owner; its controller and SSE reader were adapted from `portfolio-assistant-web`, MIT, same
  author). No runtime import across repositories and no shared package.
- **Layers**: `domain/` (models, reducer, explicit `phase()`, URL policy, rich-text parser; pure),
  `application/` (controller over two small ports; no React), `adapters/` (HTTP + bounded SSE reader
  + runtime validation), `presentation/` (React, Base UI dialog and tooltip, owned button variants,
  tokens, one CSS Module for geometry), `entry.ts` (the only module that wires adapters). Enforced
  by `tests/unit/assistant/boundaries.test.ts`.
- **Disabled by default, compiled out.** `NEXT_PUBLIC_ASSISTANT_ENABLED` must be exactly `true` to
  enable; unset/empty/`false` disables; anything else fails `scripts/check-env.ts` without echoing the
  value. `src/features/assistant/slot.tsx` imports the client code behind an inline build-time
  comparison, so a disabled build emits no assistant module, chunk, string or API origin
  (`scripts/check-assistant-disabled.ts`, `tests/e2e/assistant-disabled.spec.ts`). The static export
  bakes the value in: switching it requires a rebuild and a release.
- **Cross-origin API.** The browser calls `NEXT_PUBLIC_ASSISTANT_API_ORIGIN` (`/api/v1/...`) with
  `credentials: "include"`. The store gains no endpoint and no proxy; vps-ops owns routing/TLS. The
  API allows CORS only for the exact store origin, keeps its session in a host-only, HttpOnly,
  Secure, SameSite=Lax cookie on its own host, and checks `Origin` + CSRF header on every mutation.
  This works because the store and the API host are **same-site** (subdomains of one registrable
  domain); it does not remove the cross-origin checks.
- **Host semantics** follow the owner's portfolio native assistant (`gonzalomartinperez/portfolio`
  `79905c2`, MIT, adapted to this design system and audience): compact desktop is a named
  non-modal region; expanded and phone surfaces are modal (inert background, contained focus,
  Escape, focus restoration); VisualViewport sizing on phones; a scoped motion hold that pauses and
  defers the WebGL scene without changing the visitor's preference.
- **Lazy and route-scoped.** The launcher (in the root layout, so client navigation keeps the
  conversation) is the only eager piece; the panel, controller and session load on first use. It is
  shown on the hub, core product landings and support only; never on the offer, thank-you or legal
  pages.

## Consequences

- No tracking, analytics or replay is added for the assistant; Hotmart, checkout and consent code
  are untouched.
- Enabled builds are verification artifacts only (`out-assistant-fixture/`, `UNPUBLISHABLE.txt`,
  `build-info.json` `assistant: "enabled"`), rejected by the publish guard.
- Activation needs: owner authorization, approved API hostname, the API's `ALLOWED_ORIGINS`, the
  privacy-policy section, CSP `connect-src` for the API origin (edge rules are report-only today),
  paid-model authorization and live evaluation on the API side. See `docs/assistant.md`.
