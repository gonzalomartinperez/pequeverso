# Assistant verification (enabled build, fixture API)

`npm run test:e2e:assistant` builds `out-assistant-fixture/` (assistant ENABLED, **never publish**),
starts `pequeverso-assistant-api` from `$ASSISTANT_API_DIR` in fixture mode and runs
`playwright.assistant.config.ts`. `ASSISTANT_API_DIR` must be a checkout of the API at the commit in
`api-revision` with `uv sync --frozen` already run. No model is called; nothing is intercepted except
the explicit outage test. Reports: `playwright-report-assistant/`; screenshots:
`test-results-assistant/screenshots/` (unpublishable CI artifact).
