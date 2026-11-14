import assert from "node:assert/strict";
import { test } from "node:test";
import { type Measurement, suggestCeilings } from "../../tools/interaction-suggest.ts";

const m = (key: string, value: number): Measurement => ({
  project: "chromium-390",
  route: "/",
  key,
  value,
});
const ceilings = [
  { key: "frame-hero-p95-ms", value: 100, unit: "ms", direction: "max" as const },
  { key: "inp-proxy-ms", value: 1000, unit: "ms", direction: "max" as const },
];

test("suggested ceilings come from the worst run plus headroom and only tighten", () => {
  const runs = [
    [m("frame-hero-p95-ms", 40), m("inp-proxy-ms", 200)],
    [m("frame-hero-p95-ms", 80), m("inp-proxy-ms", 300)],
  ];
  const [frame, inp] = suggestCeilings(ceilings, runs);
  assert.equal(frame?.value, 100, "worst 80 + 25% + 5 = 105 is above 100: never raised");
  assert.equal(inp?.value, 380, "300 * 1.25 + 5");
});

test("a key with no measurement is an error, never a silent pass", () => {
  assert.throws(() => suggestCeilings(ceilings, [[m("inp-proxy-ms", 1)]]), /frame-hero-p95-ms/);
});

test("headroom must be a finite number above zero", () => {
  const runs = [[m("frame-hero-p95-ms", 1), m("inp-proxy-ms", 1)]];
  for (const bad of [0, -0.5, Number.NaN, Number.POSITIVE_INFINITY])
    assert.throws(() => suggestCeilings(ceilings, runs, bad), /headroom/);
});

test("non-finite samples are ignored, so they cannot poison a ceiling", () => {
  const runs = [
    [m("frame-hero-p95-ms", Number.NaN), m("frame-hero-p95-ms", 10), m("inp-proxy-ms", 20)],
  ];
  const [frame] = suggestCeilings(ceilings, runs);
  assert.equal(frame?.value, 18, "10 * 1.25 + 5 rounded up");
});
