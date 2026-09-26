import assert from "node:assert/strict";
import { test } from "node:test";
import { press, slotTexts, tileOrder } from "../../src/features/playground/syllable-game.ts";

test("tile order is a deterministic permutation; three or more syllables never show the solved order", () => {
  for (const [count, key] of [
    [3, "tomate"],
    [3, "abeja"],
    [4, "camaleón"],
    [5, "x"],
  ] as const) {
    const order = tileOrder(count, key);
    assert.deepEqual(
      [...order].sort(),
      Array.from({ length: count }, (_, index) => index),
    );
    assert.notDeepEqual(
      order,
      Array.from({ length: count }, (_, index) => index),
      key,
    );
    assert.deepEqual(tileOrder(count, key), order, "same key, same order (SSR = client)");
  }
  assert.deepEqual(tileOrder(1, "sol"), [0]);
  // Two syllables: some words in reading order, some reversed, so neither is a pattern to learn.
  const pairs = ["gato", "mapa", "luna", "perro"].map((word) => tileOrder(2, word).join(""));
  assert.ok(pairs.includes("01") && pairs.includes("10"), pairs.join(" "));
  assert.deepEqual(tileOrder(0, ""), []);
});

test("slot texts follow the printed word, accents included", () => {
  assert.deepEqual(slotTexts("gato", ["GA", "TO"]), ["ga", "to"]);
  assert.deepEqual(slotTexts("camaleón", ["CA", "MA", "LE", "ÓN"]), ["ca", "ma", "le", "ón"]);
  // Lengths that do not add up fall back to the lower-cased syllables.
  assert.deepEqual(slotTexts("perro", ["PE", "RO"]), ["pe", "ro"]);
});

test("press: right syllable advances, the last one completes, misses and repeats are handled", () => {
  const gato = ["GA", "TO"];
  assert.equal(press(gato, 0, 1), "wrong");
  assert.equal(press(gato, 0, 0), "correct");
  assert.equal(press(gato, 1, 0, new Set([0])), "ignored");
  assert.equal(press(gato, 1, 1, new Set([0])), "done");
  assert.equal(press(gato, 2, 1, new Set([0, 1])), "ignored");
  assert.equal(press(gato, 0, 7), "ignored");
  // Repeated syllables are interchangeable.
  const papa = ["PA", "PA"];
  assert.equal(press(papa, 0, 1), "correct");
  assert.equal(press(papa, 1, 0, new Set([1])), "done");
});
