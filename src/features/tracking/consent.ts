/**
 * First-party consent store. Two categories: "necessary" (always on) and "marketing"
 * (Meta Pixel). The choice is versioned so a policy change re-prompts. Stored in
 * localStorage plus a cookie so future server-side checks can read it too.
 */
export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "pv_consent";
export const CONSENT_EVENT = "pv:consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 6 months

export type ConsentState = {
  version: number;
  marketing: boolean;
  updatedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function readConsent(): ConsentState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION || typeof parsed.marketing !== "boolean") return null;
    return { version: CONSENT_VERSION, marketing: parsed.marketing, updatedAt: parsed.updatedAt ?? "" };
  } catch {
    return null;
  }
}

export function writeConsent(marketing: boolean): ConsentState {
  const state: ConsentState = { version: CONSENT_VERSION, marketing, updatedAt: new Date().toISOString() };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
      // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is not available in all target browsers
      document.cookie = `${CONSENT_KEY}=${marketing ? "marketing" : "necessary"}.v${CONSENT_VERSION}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
    } catch {
      // Storage may be blocked (private mode); the banner will simply show again.
    }
    window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  }
  return state;
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true;
}

/** Subscribe to consent changes; returns an unsubscribe function. */
export function onConsentChange(listener: (state: ConsentState | null) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => listener((event as CustomEvent<ConsentState | null>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
