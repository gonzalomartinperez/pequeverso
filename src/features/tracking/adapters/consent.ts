/** Bumping this re-prompts every visitor (a policy or category change). */
export const CONSENT_VERSION = 2;
export const CONSENT_KEY = "pv_consent";
export const CONSENT_EVENT = "pv:consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

/** Consent categories a visitor can grant; "necessary" is implicit and always on. */
export type ConsentCategory = "analytics" | "marketing";

export type ConsentChoice = Record<ConsentCategory, boolean>;

/**
 * Policy before the visitor decides: measurement is on and the banner offers an equal
 * "Rechazar" that withdraws it (opt-out). A stored choice always wins over this default.
 */
export const DEFAULT_CHOICE: Readonly<ConsentChoice> = { analytics: true, marketing: true };

export type ConsentState = ConsentChoice & {
  version: typeof CONSENT_VERSION;
  updatedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parseState(raw: string): ConsentState | null {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Partial<ConsentState>;
  if (candidate.version !== CONSENT_VERSION) return null;
  if (typeof candidate.analytics !== "boolean" || typeof candidate.marketing !== "boolean") return null;
  return {
    version: CONSENT_VERSION,
    analytics: candidate.analytics,
    marketing: candidate.marketing,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
  };
}

/** Cookie value `a<0|1>m<0|1>.v<version>`, readable by a future server-side check. */
export function serializeConsentCookie(choice: ConsentChoice): string {
  return `a${choice.analytics ? 1 : 0}m${choice.marketing ? 1 : 0}.v${CONSENT_VERSION}`;
}

/** Stored choice for the current `CONSENT_VERSION`, or null when the visitor must be prompted. */
export function readConsent(): ConsentState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? parseState(raw) : null;
  } catch {
    return null;
  }
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
    // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is not available in all target browsers
    document.cookie = `${CONSENT_KEY}=${serializeConsentCookie(state)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
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
  if (category === "none") return true;
  return state ? state[category] : DEFAULT_CHOICE[category];
}

/** Subscribe to consent changes; returns an unsubscribe function. */
export function onConsentChange(listener: (state: ConsentState) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => listener((event as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
