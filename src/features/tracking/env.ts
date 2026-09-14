import { createMetaAdapter } from "./adapters/meta.ts";
import type { TrackingAdapter } from "./adapters/types.ts";

export type TrackingEnv = {
  metaPixelId: string;
  debug: boolean;
};

/**
 * Build-time configuration; static `process.env.NEXT_PUBLIC_*` references so Next.js inlines
 * them. The only tracking variable is the Meta Pixel id; everything else is policy in code.
 */
export const trackingEnv: TrackingEnv = {
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  debug: process.env.NODE_ENV === "development",
};

const adapters: readonly TrackingAdapter[] = [createMetaAdapter(trackingEnv.metaPixelId)];

/** Adapters whose variables are set at build time, in injection order. */
export function enabledAdapters(): TrackingAdapter[] {
  return adapters.filter((adapter) => adapter.enabled);
}
