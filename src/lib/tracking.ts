/**
 * First-party tracking helper (replaces the WordPress PixelYourSite setup).
 *
 * Ownership (see docs/tracking.md):
 * - Site (browser only): PageView, ViewContent, PequeversoProductInterest, CheckoutIntent.
 * - Hotmart: InitiateCheckout and Purchase (browser + server on Hotmart's side).
 * The site never fires InitiateCheckout or Purchase.
 *
 * Behaviour:
 * - No-op unless NEXT_PUBLIC_META_PIXEL_ID is set at build time and the visitor has
 *   granted marketing consent. Events raised before consent are queued and flushed
 *   once consent is granted; rejected consent drops the queue.
 * - Every event carries a UUID eventID (Meta dedup contract) and is mirrored to
 *   window.dataLayer for debugging or a future tag manager.
 * - NEXT_PUBLIC_TRACKING_DEBUG=1 logs each event to the console.
 */
import { hasMarketingConsent, onConsentChange } from "./consent";

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const DEBUG = process.env.NEXT_PUBLIC_TRACKING_DEBUG === "1";

export type StandardEvent = "PageView" | "ViewContent";
export type CustomEvent = "PequeversoProductInterest" | "CheckoutIntent" | "ThankYouViewed";
export type EventName = StandardEvent | CustomEvent;
export type EventParams = Record<string, string | number | boolean | undefined>;

type QueuedEvent = { name: EventName; params: EventParams; eventId: string };

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
    dataLayer?: unknown[];
  }
}

const STANDARD: ReadonlySet<string> = new Set<StandardEvent>(["PageView", "ViewContent"]);
let queue: QueuedEvent[] = [];
let consentSubscribed = false;

export function isTrackingConfigured(): boolean {
  return PIXEL_ID.length > 0;
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `pv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function log(...args: unknown[]): void {
  if (DEBUG && typeof console !== "undefined") console.debug("[pv:track]", ...args);
}

function pushDataLayer(event: QueuedEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: event.name, event_id: event.eventId, ...event.params });
}

function sendToPixel(event: QueuedEvent): boolean {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;
  const method = STANDARD.has(event.name) ? "track" : "trackCustom";
  window.fbq(method, event.name, event.params, { eventID: event.eventId });
  return true;
}

function ensureConsentSubscription(): void {
  if (consentSubscribed || typeof window === "undefined") return;
  consentSubscribed = true;
  onConsentChange((state) => {
    if (state?.marketing) flush();
    else queue = [];
  });
}

/** Sends queued events once the pixel is loaded and consent is granted. */
export function flush(): void {
  if (!isTrackingConfigured() || !hasMarketingConsent()) return;
  const pending = queue;
  queue = [];
  for (const event of pending) {
    if (!sendToPixel(event)) queue.push(event);
    else log("flushed", event.name, event.eventId);
  }
}

/**
 * Track an event. Returns the eventID so callers can correlate (e.g. append it to a
 * checkout URL in the future). Safe to call on the server (no-op) and without config.
 */
export function track(name: EventName, params: EventParams = {}): string {
  const event: QueuedEvent = { name, params: stripUndefined(params), eventId: newEventId() };
  pushDataLayer(event);
  log(name, event.params, event.eventId);
  if (!isTrackingConfigured()) return event.eventId;
  ensureConsentSubscription();
  if (!hasMarketingConsent() || !sendToPixel(event)) queue.push(event);
  return event.eventId;
}

export function trackPageView(): string {
  return track("PageView");
}

export function trackViewContent(params: {
  product: string;
  name: string;
  value: number;
  currency: string;
}): string {
  return track("ViewContent", {
    content_ids: params.product,
    content_name: params.name,
    content_type: "product",
    value: params.value,
    currency: params.currency,
  });
}

export function trackProductInterest(params: {
  product: string;
  position: string;
  destination: string;
}): string {
  return track("PequeversoProductInterest", {
    product: params.product,
    cta_position: params.position,
    destination: params.destination,
  });
}

export function trackCheckoutIntent(params: {
  product: string;
  offer: string;
  position: string;
  offerMode?: string;
}): string {
  return track("CheckoutIntent", {
    product: params.product,
    offer: params.offer,
    cta_position: params.position,
    offer_mode: params.offerMode,
  });
}

function stripUndefined(params: EventParams): EventParams {
  const out: EventParams = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out[key] = value;
  return out;
}

/** Test hook: reset module state. */
export function _resetForTests(): void {
  queue = [];
  consentSubscribed = false;
}
