import { createMetaAdapter } from "./adapters/meta.ts";
import type { ConsentMode, TrackingAdapter } from "./adapters/types.ts";
import { createUmamiAdapter } from "./adapters/umami.ts";

export type TrackingEnv = {
  metaPixelId: string;
  umamiScriptUrl: string;
  umamiWebsiteId: string;
  consentMode: ConsentMode;
  debug: boolean;
};

function parseConsentMode(value: string | undefined): ConsentMode {
  return value === "advanced" ? "advanced" : "strict";
}

/** Build-time configuration; static `process.env.NEXT_PUBLIC_*` references so Next.js inlines them. */
export const trackingEnv: TrackingEnv = {
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  umamiScriptUrl: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "",
  umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "",
  consentMode: parseConsentMode(process.env.NEXT_PUBLIC_CONSENT_MODE),
  debug: process.env.NEXT_PUBLIC_TRACKING_DEBUG === "1",
};

const adapters: readonly TrackingAdapter[] = [
  createMetaAdapter(trackingEnv.metaPixelId),
  createUmamiAdapter(trackingEnv.umamiScriptUrl, trackingEnv.umamiWebsiteId),
];

/** Adapters whose variables are set at build time, in injection order. */
export function enabledAdapters(): TrackingAdapter[] {
  return adapters.filter((adapter) => adapter.enabled);
}
