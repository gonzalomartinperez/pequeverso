import type { GatedIntegration } from "../../consent/domain/policy.ts";
import { enabledAdapters, siteAnalyticsBuilt } from "../adapters/env.ts";

/**
 * What the consent banner must ask about, for the composition root to pass down (ADR-0016: the
 * banner never imports tracking). Build-time values: the same on the server and in the browser.
 * A plain module in `presentation/`: composition may reach tracking only through presentation.
 */
export function consentIntegrations(): {
  integrations: GatedIntegration[];
  analyticsBuilt: boolean;
} {
  const integrations = enabledAdapters().flatMap(({ category, label }) =>
    category === "none" ? [] : [{ category, label }],
  );
  return { integrations, analyticsBuilt: siteAnalyticsBuilt };
}
