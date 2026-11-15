import assert from "node:assert/strict";
import { test } from "node:test";
import { enabledAdapters, siteAnalyticsBuilt } from "../../src/features/tracking/adapters/env.ts";
import { consentIntegrations } from "../../src/features/tracking/presentation/consent-integrations.ts";

test("the banner is told about every enabled gated adapter, never about category none", () => {
  const { integrations, analyticsBuilt } = consentIntegrations();
  const gated = enabledAdapters().filter((adapter) => adapter.category !== "none");
  assert.deepEqual(
    integrations,
    gated.map(({ category, label }) => ({ category, label })),
  );
  for (const integration of integrations) {
    assert.notEqual(integration.category as string, "none");
    // Only serializable fields cross the server-to-client boundary.
    assert.deepEqual(Object.keys(integration).sort(), ["category", "label"]);
  }
  assert.equal(analyticsBuilt, siteAnalyticsBuilt);
});
