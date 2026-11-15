import {
  CONSENT_EVENT,
  CONSENT_KEY,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
  type ConsentCategory,
  type ConsentChoice,
  type ConsentState,
  grants,
  parseConsentState,
  serializeConsentCookie,
} from "../domain/policy.ts";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** Stored choice for the current `CONSENT_VERSION`, or null when the visitor must be prompted. */
export function readConsent(): ConsentState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? parseConsentState(raw) : null;
  } catch {
    return null;
  }
}

/** Expires the `pv_consent` cookie so the server-side relay gate sees no grant (storage was cleared). */
export function expireConsentCookie(): void {
  if (!isBrowser()) return;
  // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is not available in all target browsers #177
  document.cookie = `${CONSENT_KEY}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

/** Persists the choice (localStorage + cookie) and notifies subscribers. */
export function writeConsent(choice: ConsentChoice): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics: choice.analytics,
    marketing: choice.marketing,
    updatedAt: new Date().toISOString(),
  };
  if (!isBrowser()) return state;
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is not available in all target browsers #177
    document.cookie = `${CONSENT_KEY}=${serializeConsentCookie(state)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`;
  } catch {
    return state;
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  return state;
}

/** Whether `category` may run: "none" always, others per the stored choice or `DEFAULT_CHOICE`. */
export function hasConsent(
  category: ConsentCategory | "none",
  state: ConsentState | null = readConsent(),
): boolean {
  return grants(category, state);
}

/**
 * Subscribe to consent changes (same-tab `pv:consent`, other-tab `storage`); returns an
 * unsubscribe function. Both are only invalidation signals: the listener always gets the
 * validated stored choice (`null` when nothing valid is stored), never an event payload.
 */
export function onConsentChange(listener: (state: ConsentState | null) => void): () => void {
  if (!isBrowser()) return () => {};
  const changed = () => listener(readConsent());
  const storage = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key === CONSENT_KEY || key === null) changed();
  };
  window.addEventListener(CONSENT_EVENT, changed);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, changed);
    window.removeEventListener("storage", storage);
  };
}
