import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// ADR-0011 (prior opt-in): the legal pages must not describe the Meta pixel as active by default
// or as something the visitor has to object to. Negative fixtures keep the patterns honest.
const OPT_OUT = [
  /salvo que te opongas/iu,
  /si te opones/iu,
  /se activa desde la primera página/iu,
  /el banner es el control para retirarlo/iu,
  /oposición en cualquier momento/iu,
  /puedes rechazarla\)/iu,
];
const VIEWS = ["src/views/legal/cookies-view.tsx", "src/views/legal/privacidad-view.tsx"];

test("cookie and privacy pages describe the pixel as prior opt-in, never opt-out", () => {
  for (const file of VIEWS) {
    const text = readFileSync(file, "utf8").replace(/\s+/gu, " ");
    for (const pattern of OPT_OUT) assert.doesNotMatch(text, pattern, `${file}: ${pattern}`);
    assert.match(text, /solo si (?:lo |la )?acept/iu, `${file} states the opt-in condition`);
  }
});

test("the opt-out patterns catch the wording they guard against", () => {
  for (const sample of [
    "Medición de campañas mediante el píxel de Meta, salvo que te opongas.",
    "El píxel de Meta se activa desde la primera página que visitas",
  ])
    assert.ok(
      OPT_OUT.some((pattern) => pattern.test(sample)),
      sample,
    );
});
