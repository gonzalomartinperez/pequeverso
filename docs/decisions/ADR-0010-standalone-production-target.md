# ADR-0010: Production target is the Hostinger Node.js Web App (standalone)

Date: 2026-11-14 · Status: accepted (M1-5); finalised at M4-2 when the static export is retired ·
Supersedes: [ADR-0001](ADR-0001-hosting-target.md)

## Context

ADR-0001 chose a static export served by LiteSpeed from a `deploy` branch and kept the Node.js
standalone server as a fallback. The same day the owner connected the repository to a Hostinger
Node.js Web App instead (ADR-0001 addendum), and since 2026-10-13 that app builds and publishes
every merge to `main` (`docs/deployment.md`). Production has run on the standalone server ever
since: `config/next.ts` detects Hostinger's `/hbuilds/` builder, and the Meta Conversions API
relay exists only as the standalone route handler (`src/app/api/meta/events/route.standalone.ts`).
The repository docs still called the static export the default target, which misleads agents and
reviewers about what users are served.

The owner decision register records the outcome: production is standalone only, and the static
export is retired at M4 (DR-08, PV-D3 in `docs/master-plan/owner-decisions.md` and
`docs/master-plan/README.md`).

## Decision

1. The production target is the **Hostinger Node.js Web App** building `main`
   (`output: "standalone"`, `next build --webpack`, Node 24, GLIBC 2.28 builder). Every
   performance, header and functional claim refers to this target.
2. The static export (`out/`, `.htaccess` from `config/edge-rules.json`, `tools/serve-static.ts`,
   the `deploy` branch) is a **parity build only** until M4: it keeps the code free of request-time
   APIs, but nothing serves it to users. CI moves the export build out of the PR path into the
   nightly workflow (roadmap M1-5 with the M1-1 CI profiles); the PR path builds and tests the
   standalone artifact.
3. The "both build targets must keep working" rule in `AGENTS.md` stays in force until M4-2, which
   removes the export path (`serve-static.ts`, `gen-htaccess.ts`, htaccess artifacts, `deploy`
   branch publishing, the `pageExtensions` trick) and renames `route.standalone.ts` to `route.ts`.
4. Redirects and headers stay single-sourced in `config/edge-rules.json` and are attached by
   `config/next.ts` on the standalone target.

## Consequences

- AGENTS.md, `docs/architecture.md` and `docs/deployment.md` describe standalone as production and
  the export as a parity build.
- Hostinger builds on its own image; a merged PR and green CI do not prove deployment.
  `post-deploy-verify.yml` waits for `https://pequeverso.com/build-info.json` to report the merge
  SHA. Rollback is a revert PR on `main` (Hostinger has no rollback UI).
- Provenance cannot cover Hostinger's build. The compensating controls are the `main` ruleset, a
  `v*` tag ruleset (added in M1-6), the `build-info.json` check against the merge SHA, long Dependabot cooldowns and
  a post-build scan of the output for forbidden strings (ecosystem section 7).
- Until M4-2 the export stays buildable, so the request-time API restrictions still apply.

## Alternatives considered

- **Keep the static export as production** (ADR-0001). Rejected: the owner connected the Node.js
  Web App, the CAPI relay needs a server, and two production paths double the verification cost.
- **Self-host on the VPS.** Out of scope: the store is Hostinger-hosted and not VPS-bound
  (`docs/master-plan/roadmap.md`, M7 note).
