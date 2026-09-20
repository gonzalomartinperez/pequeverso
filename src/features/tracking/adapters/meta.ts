import type { ConsentState } from "../consent.ts";
import type { ScriptSpec, TrackedEvent, TrackingAdapter } from "./types.ts";

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

function bootstrap(pixelId: string): string {
  return `${STUB}${initCall(pixelId)}`;
}

function fbq(): Fbq | undefined {
  return typeof window === "undefined" ? undefined : window.fbq;
}

const PIXEL_COOKIES = ["_fbp", "_fbc"];

/** Expires the first-party cookies fbevents.js wrote (it sets them on the registrable domain). */
function expirePixelCookies(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const labels = (window.location?.hostname ?? "").split(".");
  const domains = [""];
  for (let index = 0; index < labels.length - 1; index += 1) domains.push(labels.slice(index).join("."));
  for (const name of PIXEL_COOKIES) {
    for (const domain of domains) {
      // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is not available in all target browsers
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}

/**
 * Meta Pixel adapter. Standard events go through `fbq('track')`, custom ones through
 * `fbq('trackCustom')`, always with `{ eventID }` so Hotmart's server events deduplicate.
 * The pixel is active from `init`; `onConsent` revokes it and expires `_fbp`/`_fbc` when the
 * visitor rejects marketing.
 */
export function createMetaAdapter(pixelId: string): TrackingAdapter {
  return {
    id: "meta",
    label: "Meta Pixel",
    category: "marketing",
    enabled: pixelId.length > 0,
    scripts(): ScriptSpec[] {
      return [
        { id: "meta-pixel-bootstrap", inline: bootstrap(pixelId), strategy: "afterInteractive" },
        { id: "meta-pixel", src: FBEVENTS_SRC, strategy: "afterInteractive" },
      ];
    },
    onConsent(state: ConsentState): void {
      fbq()?.("consent", state.marketing ? "grant" : "revoke");
      if (!state.marketing) expirePixelCookies();
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
