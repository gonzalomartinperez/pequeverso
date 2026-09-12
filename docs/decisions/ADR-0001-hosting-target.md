# ADR-0001: Hosting target — static export on a Hostinger website, Node app as fallback

Date: 2026-09-12 · Status: accepted (pending staging spike confirmation)

## Context

Hostinger Business Web Hosting includes both classic websites (LiteSpeed serving `public_html`,
SSH on port 65002, `.htaccess` with `mod_rewrite`/`mod_headers`) and Node.js Web Apps. The Hostinger
Next.js preset forces `output: 'standalone'`, builds on a Node 24 / GLIBC 2.28 image where native
SWC/Biome binaries fail, stops idle processes (cold starts), offers no rollback, regenerates
`.htaccess` on each deploy and triggers builds on push independently of CI (evidence: Hostinger docs
read 2026-09-11/12 and the portfolio deployment log). Every page of this site is static.

## Decision

Default to `output: 'export'` built in GitHub Actions and deployed over SSH into `public_html`, with
`.htaccess` generated from `config/edge-rules.json`. Keep the codebase compatible with
`NEXT_OUTPUT=standalone` and build that target on `main` as a parity check.

## Consequences

- No cold starts; the CI artifact is exactly what is deployed; rollback = redeploy; revision
  verified through `build-info.json`.
- Redirects/headers live in `.htaccess` (static) and `next.config` (standalone) from one source.
- Images are optimized at build time (`tools/media`), never at runtime.
- To confirm before the first production deploy (staging spike): `Header set`, `RewriteCond`,
  `ErrorDocument`, Range/206, HTTP/2, `rsync` availability, CDN caching behaviour.
- Fallback trigger: if the host blocks required `.htaccess` directives, switch the Deploy workflow to
  the Hostinger Node.js Web App (`standalone`) — no application code changes required.
