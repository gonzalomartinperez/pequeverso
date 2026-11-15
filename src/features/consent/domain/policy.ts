/**
 * Consent policy (ADR-0011 prior opt-in, ADR-0016 module): the one place that defines the
 * categories, the default before a choice, the stored and cookie wire formats and the analytics
 * freshness rule. Pure and import-free: the server relay imports it under plain `node`.
 */

/** Bumping this re-prompts every visitor (a policy or category change). 3 = prior opt-in (ADR-0011). */
export const CONSENT_VERSION = 3;
export const CONSENT_KEY = "pv_consent";
export const CONSENT_EVENT = "pv:consent";
/** A choice is kept for 180 days: the cookie lifetime and the analytics opt-in freshness. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/** Consent categories a visitor can grant; "necessary" is implicit and always on. */
export type ConsentCategory = "analytics" | "marketing";

export type ConsentChoice = Record<ConsentCategory, boolean>;

/**
 * Policy before the visitor decides: nothing gated runs (prior opt-in, ADR-0011). Only a
 * stored choice of the current version grants a category.
 */
export const DEFAULT_CHOICE: Readonly<ConsentChoice> = { analytics: false, marketing: false };

/** A gated integration the banner must name: its category and the tool label shown to visitors. */
export type GatedIntegration = { category: ConsentCategory; label: string };

export type ConsentState = ConsentChoice & {
  version: typeof CONSENT_VERSION;
  updatedAt: string;
};

/** Stored JSON of the current version, or null. Throws on malformed JSON (callers catch). */
export function parseConsentState(raw: string): ConsentState | null {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Partial<ConsentState>;
  if (candidate.version !== CONSENT_VERSION) return null;
  if (typeof candidate.analytics !== "boolean" || typeof candidate.marketing !== "boolean")
    return null;
  return {
    version: CONSENT_VERSION,
    analytics: candidate.analytics,
    marketing: candidate.marketing,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
  };
}

/** Cookie value `a<0|1>m<0|1>.v<version>`, read by the server-side relay gate. */
export function serializeConsentCookie(choice: ConsentChoice): string {
  return `a${choice.analytics ? 1 : 0}m${choice.marketing ? 1 : 0}.v${CONSENT_VERSION}`;
}

/** Inverse of `serializeConsentCookie`: the choice of a current-version value, otherwise null. */
export function parseConsentCookie(value: string): ConsentChoice | null {
  const match = /^a([01])m([01])\.v(\d+)$/.exec(value);
  // Exact text, not a numeric compare: "v03" is not the serializer's output and never grants.
  if (!match || match[3] !== String(CONSENT_VERSION)) return null;
  return { analytics: match[1] === "1", marketing: match[2] === "1" };
}

/**
 * True only when a `Cookie` header carries exactly one consent cookie and its value grants
 * marketing under the current version (duplicates are ambiguous and never grant).
 */
export function cookieHeaderGrantsMarketing(header: string | undefined): boolean {
  const values: string[] = [];
  for (const pair of (header || "").split(";")) {
    const at = pair.indexOf("=");
    if (at > 0 && pair.slice(0, at).trim() === CONSENT_KEY) values.push(pair.slice(at + 1).trim());
  }
  const [only] = values;
  return values.length === 1 && only !== undefined && parseConsentCookie(only)?.marketing === true;
}

/** Whether `category` may run under `state`: "none" always, others per the choice or the default. */
export function grants(category: ConsentCategory | "none", state: ConsentState | null): boolean {
  if (category === "none") return true;
  return state ? state[category] : DEFAULT_CHOICE[category];
}

const GRANT_LIFETIME_MS = CONSENT_MAX_AGE_SECONDS * 1000;

/** Analytics opt-in freshness: a current-version grant with a valid timestamp younger than 180 days. */
export function explicitGrant(value: unknown, now: number): boolean {
  if (!value || typeof value !== "object" || !Number.isFinite(now)) return false;
  const state = value as Record<string, unknown>;
  if (
    state.version !== CONSENT_VERSION ||
    state.analytics !== true ||
    typeof state.updatedAt !== "string"
  )
    return false;
  const updated = Date.parse(state.updatedAt);
  return (
    Number.isFinite(updated) &&
    new Date(updated).toISOString() === state.updatedAt &&
    now >= updated &&
    now - updated < GRANT_LIFETIME_MS
  );
}

/** A failed persistence write cannot undo a withdrawal during this document's lifetime. */
export function createConsentGate() {
  let withdrawn = false;
  let revokedTimestamp: unknown;
  return {
    withdraw(previous: unknown) {
      withdrawn = true;
      revokedTimestamp =
        previous && typeof previous === "object" ? Reflect.get(previous, "updatedAt") : undefined;
    },
    persisted(value: unknown, stored: unknown, now: number) {
      if (!explicitGrant(value, now) || !explicitGrant(stored, now)) return;
      const timestamp = Reflect.get(value as object, "updatedAt");
      if (
        timestamp === Reflect.get(stored as object, "updatedAt") &&
        timestamp !== revokedTimestamp
      )
        withdrawn = false;
    },
    allows(value: unknown, now: number) {
      return !withdrawn && explicitGrant(value, now);
    },
  };
}
