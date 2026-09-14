import type { ConsentState } from "../consent.ts";
import type { ConsentMode, ScriptSpec, TrackedEvent, TrackingAdapter } from "./types.ts";

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const FBEVENTS_SRC = "https://connect.facebook.net/en_US/fbevents.js";
const STANDARD_EVENTS: ReadonlySet<string> = new Set(["PageView", "ViewContent"]);
const STUB =
  "!function(w){if(w.fbq)return;var n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};w._fbq=w._fbq||n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);";

/**
 * Advanced matching payload for `fbq('init', id, payload)`. The site collects no
 * customer data (Hotmart owns the checkout), so there is nothing to match yet.
 */
function advancedMatching(): Record<string, string> | undefined {
  return undefined;
}

function initCall(pixelId: string): string {
  const matching = advancedMatching();
  const payload = matching ? `,${JSON.stringify(matching)}` : "";
  return `fbq('init',${JSON.stringify(pixelId)}${payload});`;
}

function bootstrap(pixelId: string, mode: ConsentMode): string {
  const revoke = mode === "advanced" ? "fbq('consent','revoke');" : "";
  return `${STUB}${revoke}${initCall(pixelId)}`;
}

function fbq(): Fbq | undefined {
  return typeof window === "undefined" ? undefined : window.fbq;
}

/**
 * Meta Pixel adapter. Standard events go through `fbq('track')`, custom ones through
 * `fbq('trackCustom')`, always with `{ eventID }` so Hotmart's server events deduplicate.
 * In `advanced` mode the bootstrap revokes consent before `init`; `onConsent` grants it.
 */
export function createMetaAdapter(pixelId: string): TrackingAdapter {
  return {
    id: "meta",
    label: "Meta Pixel",
    category: "marketing",
    enabled: pixelId.length > 0,
    scripts(mode: ConsentMode): ScriptSpec[] {
      return [
        { id: "meta-pixel-bootstrap", inline: bootstrap(pixelId, mode), strategy: "afterInteractive" },
        { id: "meta-pixel", src: FBEVENTS_SRC, strategy: "afterInteractive" },
      ];
    },
    onConsent(state: ConsentState): void {
      fbq()?.("consent", state.marketing ? "grant" : "revoke");
    },
    send(event: TrackedEvent): boolean {
      const pixel = fbq();
      if (!pixel) return false;
      const method = STANDARD_EVENTS.has(event.name) ? "track" : "trackCustom";
      pixel(method, event.name, event.params, { eventID: event.eventId });
      return true;
    },
  };
}
