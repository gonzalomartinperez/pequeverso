import {
  expireConsentCookie,
  hasConsent,
  readConsent,
} from "../../consent/adapters/browser-storage.ts";
import type { ConsentState } from "../../consent/domain/policy.ts";
import type { EventParams, ScriptSpec, TrackedEvent, TrackingAdapter } from "./types.ts";

/** One event in the body of `POST /api/meta/events` (validated by `src/features/tracking/adapters/server/meta-capi.ts`). */
export type RelayEvent = {
  name: string;
  eventId: string;
  time: number;
  sourceUrl: string;
  params: EventParams;
  fbp?: string;
  fbc?: string;
};

export type MetaCapiDeps = {
  fetch?: typeof fetch;
  now?: () => number;
  flushDelayMs?: number;
  fbpWaitMs?: number;
  endpoint?: string;
};

/** Trailing slash on purpose: the standalone target 308-redirects the slash-less form. */
export const META_CAPI_ENDPOINT = "/api/meta/events/";
const MAX_BATCH = 10;
const DEFAULT_FLUSH_DELAY_MS = 250;
const DEFAULT_FBP_WAIT_MS = 2000;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length) || undefined;
  }
  return undefined;
}

function deriveFbc(now: number): string | undefined {
  if (typeof window === "undefined") return undefined;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${now}.${fbclid}` : undefined;
}

function relayParams(params: EventParams): EventParams {
  const out: EventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value)))
      out[key] = value;
  }
  return out;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    out.push(items.slice(index, index + size));
  return out;
}

/** Sends `body` with `sendBeacon` when the page unloads; false when the beacon is unavailable or refused. */
function beacon(endpoint: string, body: string, unloading: boolean): boolean {
  if (!unloading || typeof navigator === "undefined") return false;
  if (typeof navigator.sendBeacon !== "function") return false;
  return navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
}

/** Adds the `_fbp`/`_fbc` match keys that exist to every buffered event. */
function withMatchKeys(
  events: RelayEvent[],
  fbp: string | undefined,
  fbc: string | undefined,
): RelayEvent[] {
  return events.map((event) => ({
    ...event,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  }));
}

/**
 * Meta Conversions API adapter: relays every event the browser pixel receives, with the same
 * `eventId`, to the same-origin endpoint served by `src/features/tracking/adapters/server/meta-capi.ts`, so Meta deduplicates
 * the pair. Events are coalesced for `flushDelayMs`; on a fresh visit the flush waits up to
 * `fbpWaitMs` for fbevents.js to write `_fbp` (the only match key the site has), and `pagehide`
 * flushes at once with `sendBeacon`. No vendor script and nothing to revoke: the tracker stops
 * dispatching to marketing adapters after a rejection and this adapter drops its buffer.
 */
export function createMetaCapiAdapter(pixelId: string, deps: MetaCapiDeps = {}): TrackingAdapter {
  const endpoint = deps.endpoint ?? META_CAPI_ENDPOINT;
  const now = deps.now ?? (() => Date.now());
  const flushDelayMs = deps.flushDelayMs ?? DEFAULT_FLUSH_DELAY_MS;
  const fbpWaitMs = deps.fbpWaitMs ?? DEFAULT_FBP_WAIT_MS;
  let buffer: RelayEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let waitingSince: number | null = null;
  let listening = false;

  function post(events: RelayEvent[], unloading: boolean): void {
    const body = JSON.stringify({ events });
    if (beacon(endpoint, body, unloading)) return;
    const fetchImpl = deps.fetch ?? (typeof fetch === "function" ? fetch : undefined);
    if (!fetchImpl) return;
    fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  }

  function clearTimer(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  /**
   * Re-reads storage at the send boundary: a withdrawal in another tab may not have reached this
   * tab as an event yet. Without a stored grant, drops the buffer and the grant cookie (true).
   */
  function droppedWithoutGrant(): boolean {
    const stored = readConsent();
    if (hasConsent("marketing", stored)) return false;
    buffer = [];
    waitingSince = null;
    if (stored === null) expireConsentCookie();
    return true;
  }

  /** On a fresh visit, keep waiting (up to `fbpWaitMs`) for fbevents.js to write `_fbp`. */
  function awaitingFbp(unloading: boolean, fbp: string | undefined): boolean {
    if (unloading || fbp || waitingSince === null) return false;
    return now() - waitingSince < fbpWaitMs;
  }

  function flush(unloading: boolean): void {
    clearTimer();
    if (buffer.length === 0 || droppedWithoutGrant()) return;
    const fbp = readCookie("_fbp");
    if (awaitingFbp(unloading, fbp)) {
      timer = setTimeout(() => flush(false), flushDelayMs);
      return;
    }
    waitingSince = null;
    const fbc = readCookie("_fbc") ?? deriveFbc(now());
    const events = withMatchKeys(buffer, fbp, fbc);
    buffer = [];
    for (const batch of chunk(events, MAX_BATCH)) post(batch, unloading);
  }

  function schedule(): void {
    if (waitingSince === null) waitingSince = now();
    if (timer === null) timer = setTimeout(() => flush(false), flushDelayMs);
    if (!listening && typeof window !== "undefined") {
      listening = true;
      window.addEventListener("pagehide", () => flush(true));
    }
  }

  return {
    id: "meta-capi",
    label: "Meta Pixel",
    category: "marketing",
    enabled: pixelId.length > 0,
    scripts(): ScriptSpec[] {
      return [];
    },
    onConsent(state: ConsentState): void {
      if (state.marketing) return;
      buffer = [];
      clearTimer();
    },
    send(event: TrackedEvent): boolean {
      if (typeof window === "undefined") return true;
      buffer.push({
        name: event.name,
        eventId: event.eventId,
        time: now(),
        sourceUrl: window.location.href,
        params: relayParams(event.params),
      });
      schedule();
      return true;
    },
  };
}
