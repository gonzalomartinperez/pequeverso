import assert from "node:assert/strict";
import { test } from "node:test";
import { type SceneGateInput, sceneAllowed } from "../../src/shared/motion/scene/scene-gate.ts";

const desktop: SceneGateInput = {
  fineWide: true,
  reducedMotion: false,
  short: false,
  saveData: false,
};

test("a fine pointer at least 1024 px wide gets the scene", () => {
  assert.equal(sceneAllowed(desktop), true);
});

test("phones, coarse pointers and narrow windows keep the static starfield", () => {
  assert.equal(sceneAllowed({ ...desktop, fineWide: false }), false);
});

test("reduced motion, a short viewport and Save-Data each veto the scene", () => {
  assert.equal(sceneAllowed({ ...desktop, reducedMotion: true }), false);
  assert.equal(sceneAllowed({ ...desktop, short: true }), false);
  assert.equal(sceneAllowed({ ...desktop, saveData: true }), false);
});

test("the media query is the documented D-03 pair", async () => {
  const { SCENE_MEDIA } = await import("../../src/shared/motion/scene/scene-gate.ts");
  assert.equal(SCENE_MEDIA, "(pointer: fine) and (min-width: 1024px)");
});
