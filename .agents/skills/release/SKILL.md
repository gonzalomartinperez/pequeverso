---
name: release
description: Cut a tagged release of pequeverso.com and run the gated deploy with verification and rollback.
---

# Release and deploy

1. `main` is green; `npm run check:placeholders:strict` passes (legal details supplied).
2. Update `CHANGELOG.md`, bump `version` in `package.json`, commit `chore(release): vX.Y.Z`, tag `vX.Y.Z`.
3. Run the **Deploy** workflow with the tag and target (`staging` first when available, then
   `production`). The `production` environment requires approval. The workflow publishes `out/` to
   the `deploy` branch, waits for Hostinger Git to pull it, verifies `build-info.json` matches the
   commit and runs `scripts/smoke.mjs`.
4. After production: run the curl matrix in `docs/deployment.md`, check Search Console and Hotmart
   test purchase items in `docs/migration.md`.
5. Rollback: re-run Deploy with the previous tag (or redeploy the previous `deploy` commit in hPanel → Git).
