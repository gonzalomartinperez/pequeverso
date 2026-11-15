import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
  readConsent,
  writeConsent,
} from "../../../src/features/consent/adapters/browser-storage.ts";
import {
  CONSENT_VERSION,
  parseConsentCookie,
  serializeConsentCookie,
} from "../../../src/features/consent/domain/policy.ts";
import { numRuns, seed } from "./runs.ts";

function browser(raw: string): void {
  let stored = raw;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.assign(new EventTarget(), {
      localStorage: {
        getItem: () => stored,
        setItem: (_key: string, value: string) => {
          stored = value;
        },
      },
    }),
  });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { cookie: "" } });
}

test("consent choices round trip through storage and the versioned cookie wire format", () => {
  const choice = fc.record({ analytics: fc.boolean(), marketing: fc.boolean() });
  try {
    fc.assert(
      fc.property(choice, (value) => {
        browser("");
        const state = writeConsent(value);
        assert.deepEqual(readConsent(), state);
        const cookie = serializeConsentCookie(value);
        // The policy's reader inverts the writer; an independent decode pins the documented format.
        assert.deepEqual(parseConsentCookie(cookie), { ...value });
        const parsed = /^a([01])m([01])\.v(\d+)$/.exec(cookie);
        assert.ok(parsed);
        assert.equal(Number(parsed[3]), CONSENT_VERSION);
        assert.deepEqual(
          { analytics: parsed[1] === "1", marketing: parsed[2] === "1" },
          { ...value },
        );
        assert.ok(document.cookie.startsWith(`pv_consent=${cookie};`));
      }),
      { numRuns, ...(seed === undefined ? {} : { seed }) },
    );
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  }
});

test("garbage storage never throws and returns the unchosen state", () => {
  try {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.jsonValue().map(JSON.stringify)), (raw) => {
        // Exclude valid current-version choices: arbitrary JSON can also encode a real choice.
        let candidate: unknown;
        try {
          candidate = JSON.parse(raw);
        } catch {
          candidate = null;
        }
        const valid =
          typeof candidate === "object" &&
          candidate !== null &&
          "version" in candidate &&
          candidate.version === CONSENT_VERSION &&
          "analytics" in candidate &&
          typeof candidate.analytics === "boolean" &&
          "marketing" in candidate &&
          typeof candidate.marketing === "boolean";
        browser(raw);
        if (!valid) assert.equal(readConsent(), null);
        else assert.ok(readConsent());
        browser(JSON.stringify({ version: CONSENT_VERSION, analytics: raw, marketing: false }));
        assert.equal(readConsent(), null);
      }),
      { numRuns, ...(seed === undefined ? {} : { seed }) },
    );
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  }
});

test("the cookie reader accepts only the current version's exact serialized text", () => {
  fc.assert(
    fc.property(fc.string(), (raw) => {
      const choice = parseConsentCookie(raw);
      if (choice === null) return;
      assert.equal(serializeConsentCookie(choice), raw);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
  for (const raw of [`a1m1.v${CONSENT_VERSION - 1}`, `a1m1.v0${CONSENT_VERSION}`, "a2m1.v3", ""])
    assert.equal(parseConsentCookie(raw), null, raw);
});
