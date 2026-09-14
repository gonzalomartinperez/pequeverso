import type { ScriptSpec, TrackedEvent, TrackingAdapter } from "./types.ts";

type Umami = {
  track(name: string, data?: Record<string, string | number | boolean>): void;
};

declare global {
  interface Window {
    umami?: Umami;
  }
}

/**
 * Umami adapter: cookie-less, aggregated analytics that needs no consent (`category: "none"`).
 * Page views are auto-tracked by the script itself; other events are forwarded as custom events.
 */
export function createUmamiAdapter(scriptUrl: string, websiteId: string): TrackingAdapter {
  return {
    id: "umami",
    label: "Umami",
    category: "none",
    enabled: scriptUrl.length > 0 && websiteId.length > 0,
    scripts(): ScriptSpec[] {
      return [
        { id: "umami", src: scriptUrl, strategy: "lazyOnload", attributes: { "data-website-id": websiteId } },
      ];
    },
    onConsent(): void {},
    send(event: TrackedEvent): boolean {
      if (event.name === "PageView") return true;
      const umami = typeof window === "undefined" ? undefined : window.umami;
      if (!umami) return false;
      umami.track(event.name, { ...definedParams(event.params), event_id: event.eventId });
      return true;
    },
  };
}

function definedParams(params: TrackedEvent["params"]): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out[key] = value;
  return out;
}
