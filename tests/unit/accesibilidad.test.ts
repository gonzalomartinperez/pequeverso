import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { supportResponseTime } from "../../config/commerce.ts";
import { pageReviewed } from "../../config/content-dates.ts";
import { site } from "../../config/site.ts";
import { accesibilidadCopy as copy, longDate } from "../../content/es/legal/accesibilidad.ts";
import { COPY_RULES } from "./copy-language.test.ts";

const strings = JSON.stringify([
  copy.intro,
  copy.commitment,
  copy.verification,
  copy.limitations,
  copy.barriers,
  copy.eaa,
]);

test("accessibility statement facts come from config, not from the copy", () => {
  assert.equal(copy.contactEmail, site.supportEmail);
  assert.equal(copy.responseTime, supportResponseTime);
  assert.equal(copy.reviewedAt, longDate(pageReviewed.accessibility));
  assert.equal(longDate("2026-11-14"), "14 de noviembre de 2026");
  assert.match(copy.reviewLine(copy.reviewedAt), new RegExp(copy.reviewedAt));
});

test("accessibility statement invents no periods, counts or conformance claims", () => {
  // The only numbers are WCAG/EAA identifiers, the 24 px target, the 200 % zoom and 320-1920 px.
  const numbers = strings.match(/\d+(?:\.\d+)*/g) ?? [];
  const allowed = new Set(["2.2", "2.0", "2.1", "24", "200", "320", "1920", "2019", "882"]);
  for (const number of numbers) assert.ok(allowed.has(number), `unexpected figure ${number}`);
  assert.doesNotMatch(strings, /\b(cumple|conforme|certificad[oa]) (totalmente|plenamente)\b/i);
  assert.match(copy.commitment.join(" "), /no declaramos que el sitio cumpla/);
  assert.doesNotMatch(copy.eaa, /\b(estamos exentos|no nos alcanza|nos alcanza plenamente)\b/i);
});

test("accessibility statement uses tú and the shared copy rules", () => {
  for (const [rule, patterns] of Object.entries(COPY_RULES)) {
    for (const pattern of patterns) assert.doesNotMatch(strings, pattern, rule);
  }
  assert.match(strings, /\bescríbenos\b/);
  assert.match(strings, /\bTodavía no\b/);
});

test("accessibility statement cites only checks that exist in tests/browser", () => {
  const a11y = readFileSync("tests/browser/a11y.spec.ts", "utf8");
  assert.match(a11y, /\/accesibilidad\//);
  assert.match(a11y, /wcag22aa/);
  assert.match(readFileSync("tests/browser/text-zoom.spec.ts", "utf8"), /200 %/);
  assert.match(readFileSync("tests/browser/responsive.spec.ts", "utf8"), /320/);
});
