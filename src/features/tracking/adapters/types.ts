import type { ConsentCategory, ConsentState } from "../consent.ts";

/** Consent mode selected at build time (`NEXT_PUBLIC_CONSENT_MODE`). */
export type ConsentMode = "strict" | "advanced";

/** Identifier of a shipped adapter. Extend the union when a new adapter is added. */
export type AdapterId = "meta" | "umami";

/** Consent category an adapter belongs to; `none` needs no consent (cookie-less, no personal data). */
export type AdapterCategory = ConsentCategory | "none";

/** Subset of `next/script` strategies the adapters use. */
export type ScriptStrategy = "afterInteractive" | "lazyOnload";

/** A script an adapter needs in the page: exactly one of `src` or `inline`. */
export type ScriptSpec = {
  id: string;
  src?: string;
  inline?: string;
  strategy: ScriptStrategy;
  attributes?: Readonly<Record<string, string>>;
};

/** Event parameter values accepted by every adapter. */
export type EventParams = Record<string, string | number | boolean | undefined>;

/** An event after the tracker assigned its UUID. */
export type TrackedEvent = {
  name: string;
  params: EventParams;
  eventId: string;
};

/**
 * Vendor integration boundary. `track()` owns event ids, the `dataLayer` mirror and the
 * per-adapter queue; `TrackingScripts` owns script injection; an adapter only translates.
 *
 * Adding an adapter (for example TikTok or gtag):
 * 1. Add its id to `AdapterId` and a factory `createXAdapter(config)` in `adapters/x.ts` that
 *    returns this shape; `enabled` must be false when its `NEXT_PUBLIC_*` value is empty.
 * 2. `scripts(mode)` returns the vendor stub and loader; in `advanced` mode the stub must start
 *    with the vendor's consent-revoke call so nothing is sent before `onConsent` grants.
 * 3. `send()` maps standard names (`PageView`, `ViewContent`) to the vendor's standard events
 *    and passes `eventId` as the vendor's deduplication id; return `false` when the vendor
 *    global is not ready so the tracker keeps the event queued.
 * 4. Register the factory in `env.ts` (`enabledAdapters`), validate its variable in
 *    `scripts/check-env.mjs`, and document it in `docs/tracking.md` and `/cookies/`.
 */
export interface TrackingAdapter {
  readonly id: AdapterId;
  readonly label: string;
  readonly category: AdapterCategory;
  readonly enabled: boolean;
  scripts(mode: ConsentMode): ScriptSpec[];
  onConsent(state: ConsentState): void;
  send(event: TrackedEvent): boolean;
}
