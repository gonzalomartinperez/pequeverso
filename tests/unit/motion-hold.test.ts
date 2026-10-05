import assert from "node:assert/strict";
import { test } from "node:test";

const dataset: Record<string, string> = {};
Object.assign(globalThis, { document: { documentElement: { dataset } } });
const { holdPageMotion, isPageMotionHeld, subscribePageMotionHold } = await import(
  "../../src/motion/motion-hold.ts"
);

test("holds stack, release is idempotent and the root flag mirrors them", () => {
  const seen: boolean[] = [];
  const unsubscribe = subscribePageMotionHold(() => seen.push(isPageMotionHeld()));
  const first = holdPageMotion();
  const second = holdPageMotion();
  assert.equal(isPageMotionHeld(), true);
  assert.equal(dataset.motionHold, "");
  first();
  first();
  assert.equal(isPageMotionHeld(), true, "another surface still holds motion");
  second();
  assert.equal(isPageMotionHeld(), false);
  assert.equal("motionHold" in dataset, false);
  assert.deepEqual(seen, [true, true, true, false]);
  unsubscribe();
});
