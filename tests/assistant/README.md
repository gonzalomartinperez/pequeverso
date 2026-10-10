# Assistant verification (enabled build, fixture API)

`npm run test:e2e:assistant` builds `out-assistant-fixture/` (assistant ENABLED, **never publish**),
starts `pequeverso-assistant-api` from `$ASSISTANT_API_DIR` in fixture mode and runs
`playwright.assistant.config.ts`. `ASSISTANT_API_DIR` must be a checkout of the API at the commit in
`api-revision` with `uv sync --frozen` already run. No model is called. Targeted tests hold and
forward real HTTP requests or interrupt transport to verify waiting, cancellation and recovery;
they do not fabricate provider stages or substitute answers. Reports: `playwright-report-assistant/`; screenshots:
`test-results-assistant/screenshots/` (unpublishable CI artifact).

Six preview states are generated under `test-results-assistant/preview/`. Desktop previews use
the expanded panel; these local fixture images do not validate a provider model or a VPS deployment.
