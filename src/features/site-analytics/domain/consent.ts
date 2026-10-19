/** Independent opt-in freshness. Existing marketing defaults and storage parser stay untouched. */
export function explicitGrant(value: unknown, now: number): boolean {
  if (!value || typeof value !== "object" || !Number.isFinite(now)) return false;
  const state = value as Record<string, unknown>;
  if (state.version !== 2 || state.analytics !== true || typeof state.updatedAt !== "string") return false;
  const updated = Date.parse(state.updatedAt);
  return (
    Number.isFinite(updated) &&
    new Date(updated).toISOString() === state.updatedAt &&
    now >= updated &&
    now - updated < 180 * 24 * 60 * 60 * 1000
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
      if (timestamp === Reflect.get(stored as object, "updatedAt") && timestamp !== revokedTimestamp)
        withdrawn = false;
    },
    allows(value: unknown, now: number) {
      return !withdrawn && explicitGrant(value, now);
    },
  };
}
