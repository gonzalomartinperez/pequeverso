import type { EventParams, TrackedEvent, TrackingAdapter } from "./adapters/types.ts";
import { type ConsentState, hasConsent, onConsentChange, readConsent } from "./consent.ts";
import { enabledAdapters, trackingEnv } from "./env.ts";

/** Events owned by Hotmart's checkout; the site must never emit them (see docs/tracking.md). */
export const FORBIDDEN_EVENTS = ["InitiateCheckout", "Purchase", "PlaceAnOrder", "begin_checkout"] as const;

type ForbiddenEvent = (typeof FORBIDDEN_EVENTS)[number];
type StandardEvent = "PageView" | "ViewContent";
type CustomEvent = "PequeversoProductInterest" | "CheckoutIntent";

/** Events the site may emit; the forbidden set is excluded by construction. */
export type EventName = Exclude<StandardEvent | CustomEvent, ForbiddenEvent>;
export type { EventParams };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let adapters: readonly TrackingAdapter[] = enabledAdapters();
const queues = new Map<string, TrackedEvent[]>();
let unsubscribe: (() => void) | null = null;

/** True when at least one adapter has its configuration set. */
export function isTrackingConfigured(): boolean {
  return adapters.length > 0;
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `pv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function log(...args: unknown[]): void {
  if (trackingEnv.debug && typeof console !== "undefined") console.debug("[pv:track]", ...args);
}

function isForbidden(name: string): boolean {
  return (FORBIDDEN_EVENTS as readonly string[]).includes(name);
}

function assertAllowed(name: string): boolean {
  if (!isForbidden(name)) return true;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(`[pv:track] "${name}" is owned by Hotmart and must never be sent by the site`);
  }
  return false;
}

function stripUndefined(params: EventParams): EventParams {
  const out: EventParams = {};
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out[key] = value;
  return out;
}

function pushDataLayer(event: TrackedEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: event.name, event_id: event.eventId, ...event.params });
}

function queueFor(adapter: TrackingAdapter): TrackedEvent[] {
  const queue = queues.get(adapter.id) ?? [];
  queues.set(adapter.id, queue);
  return queue;
}

function dispatch(adapter: TrackingAdapter, event: TrackedEvent, state: ConsentState | null): void {
  const allowed = hasConsent(adapter.category, state);
  if (allowed && adapter.send(event)) {
    log("sent", adapter.id, event.name, event.eventId);
    return;
  }
  if (allowed || state === null) queueFor(adapter).push(event);
}

function flushAdapter(adapter: TrackingAdapter, state: ConsentState | null): void {
  if (!hasConsent(adapter.category, state)) return;
  const pending = queueFor(adapter).splice(0);
  for (const event of pending) dispatch(adapter, event, state);
}

function applyConsent(state: ConsentState): void {
  for (const adapter of adapters) {
    adapter.onConsent(state);
    if (hasConsent(adapter.category, state)) flushAdapter(adapter, state);
    else queues.delete(adapter.id);
  }
}

function ensureConsentSubscription(): void {
  if (unsubscribe || typeof window === "undefined") return;
  unsubscribe = onConsentChange(applyConsent);
}

/** Re-sends queued events to every adapter whose category is consented and whose script is ready. */
export function flush(): void {
  const state = readConsent();
  for (const adapter of adapters) flushAdapter(adapter, state);
}

/** Re-applies the stored consent to every adapter (grant/revoke) and flushes; call when a script loads. */
export function syncConsent(): void {
  const state = readConsent();
  if (state) applyConsent(state);
  else flush();
}

/**
 * Records an event: UUID id, `window.dataLayer` mirror, then every enabled adapter (sent now
 * when its category is consented, queued otherwise). Returns the event id; safe on the server.
 */
export function track(name: EventName, params: EventParams = {}): string {
  if (!assertAllowed(name)) return "";
  const event: TrackedEvent = { name, params: stripUndefined(params), eventId: newEventId() };
  pushDataLayer(event);
  log(name, event.params, event.eventId);
  if (typeof window === "undefined") return event.eventId;
  ensureConsentSubscription();
  const state = readConsent();
  for (const adapter of adapters) dispatch(adapter, event, state);
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

/** Test hook: reset queues and subscriptions, optionally swapping the adapter list. @internal */
export function _resetForTests(list: readonly TrackingAdapter[] = enabledAdapters()): void {
  adapters = list;
  queues.clear();
  unsubscribe?.();
  unsubscribe = null;
}
