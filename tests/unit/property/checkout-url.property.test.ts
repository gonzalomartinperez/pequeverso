import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
  checkoutPassthroughParams,
  checkoutPassthroughPrefixes,
} from "../../../config/commerce.ts";
import { buildCheckoutUrl, sckFor } from "../../../src/features/commerce/domain/checkout-url.ts";
import { numRuns, seed } from "./runs.ts";

const allowedKey = fc
  .oneof(
    fc.constantFrom(...checkoutPassthroughParams),
    fc
      .tuple(fc.constantFrom(...checkoutPassthroughPrefixes), fc.string())
      .map(([prefix, suffix]) => `${prefix}${suffix}`),
  )
  .chain((name) => fc.constantFrom(name, name.toUpperCase()));
const key = fc.oneof(allowedKey, fc.constantFrom("off", "ref", "OFF", "REF", "foo"), fc.string());
const entries = fc.array(
  fc.tuple(
    key,
    fc.oneof(fc.string({ maxLength: 120 }), fc.string({ minLength: 31, maxLength: 120 })),
  ),
  { maxLength: 25 },
);
const base = "https://pay.hotmart.com/TEST0000000?checkoutMode=10";
const permitted = (name: string): boolean =>
  (checkoutPassthroughParams as readonly string[]).includes(name.toLowerCase()) ||
  checkoutPassthroughPrefixes.some((prefix) => name.toLowerCase().startsWith(prefix));

test("checkout preserves its trusted Hotmart base, filters visitor/extra params and is idempotent", () => {
  // Base URLs are trusted build configuration; offer selection in the base must be preserved.
  fc.assert(
    fc.property(entries, entries, entries, (incoming, extras, baseEntries) => {
      const search = new URLSearchParams(incoming).toString();
      const extra = Object.fromEntries(extras);
      const trusted = new URL(base);
      for (const [name, value] of baseEntries) trusted.searchParams.append(name, value);
      const built = buildCheckoutUrl(trusted.toString(), search, extra);
      const url = new URL(built);
      assert.equal(url.origin, "https://pay.hotmart.com");
      assert.equal(url.pathname, "/TEST0000000");
      assert.equal(url.searchParams.get("checkoutMode"), "10");
      for (const name of new Set(trusted.searchParams.keys())) {
        assert.deepEqual(url.searchParams.getAll(name), trusted.searchParams.getAll(name));
      }
      // First non-empty page value wins; extras only fill keys absent from both base and page.
      const expected = new Map<string, string>();
      for (const [name, value] of [...incoming, ...Object.entries(extra)]) {
        if (!value || !permitted(name) || trusted.searchParams.has(name) || expected.has(name))
          continue;
        expected.set(name, name.toLowerCase() === "sck" ? value.slice(0, 30) : value);
      }
      for (const [name, value] of expected)
        assert.deepEqual(url.searchParams.getAll(name), [value]);
      for (const [name, value] of url.searchParams) {
        if (trusted.searchParams.has(name)) continue;
        assert.ok(permitted(name), name);
        assert.ok(!["off", "ref"].includes(name.toLowerCase()));
        if (name.toLowerCase() === "sck") assert.ok(value.length <= 30);
      }
      assert.equal(buildCheckoutUrl(built, search, extra), built);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

test("generated sck is sanitized and capped for any prefix and placement", () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), (prefix, position) => {
      const value = sckFor(prefix, position);
      assert.match(value, /^[a-z0-9-]*$/i);
      assert.ok(value.length <= 30);
    }),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});

test("allowlisted duplicates use the first non-empty value with base, page, extra precedence", () => {
  fc.assert(
    fc.property(
      allowedKey,
      fc.string({ minLength: 1, maxLength: 120 }),
      fc.string({ minLength: 1, maxLength: 120 }),
      (name, first, later) => {
        const page = new URLSearchParams([
          [name, ""],
          [name, first],
          [name, later],
        ]).toString();
        const extra = { [name]: later };
        const capped = name.toLowerCase() === "sck" ? first.slice(0, 30) : first;
        assert.equal(new URL(buildCheckoutUrl(base, page, extra)).searchParams.get(name), capped);
        assert.equal(
          new URL(buildCheckoutUrl(base, "", { [name]: first })).searchParams.get(name),
          capped,
        );
        const trusted = new URL(base);
        trusted.searchParams.set(name, first);
        assert.equal(
          new URL(buildCheckoutUrl(trusted.toString(), page, extra)).searchParams.get(name),
          first,
        );
      },
    ),
    { numRuns, ...(seed === undefined ? {} : { seed }) },
  );
});
