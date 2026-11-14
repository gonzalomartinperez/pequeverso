import assert from "node:assert/strict";
import { test } from "node:test";
import {
  afterFirstInteraction,
  type SceneGateInput,
  sceneAllowed,
} from "../../src/shared/motion/scene/scene-gate.ts";

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

function stubWindow(readyState: string) {
  const target = new EventTarget();
  const counts = new Map<string, number>();
  const add = target.addEventListener.bind(target);
  const remove = target.removeEventListener.bind(target);
  Object.assign(globalThis, {
    window: Object.assign(target, {
      addEventListener: (type: string, fn: EventListener, options?: unknown) => {
        counts.set(type, (counts.get(type) ?? 0) + 1);
        add(type, fn, options as AddEventListenerOptions);
      },
      removeEventListener: (type: string, fn: EventListener) => {
        counts.set(type, (counts.get(type) ?? 0) - 1);
        remove(type, fn);
      },
    }),
    document: { readyState },
  });
  return { target, listeners: () => [...counts.values()].reduce((a, b) => a + b, 0) };
}

test("afterFirstInteraction fires once and leaves no listener behind", () => {
  const { target, listeners } = stubWindow("complete");
  let calls = 0;
  afterFirstInteraction(() => {
    calls += 1;
  });
  assert.equal(listeners(), 4);
  target.dispatchEvent(new Event("keydown"));
  target.dispatchEvent(new Event("pointerdown"));
  target.dispatchEvent(new Event("wheel"));
  assert.equal(calls, 1);
  assert.equal(listeners(), 0);
});

test("a cancelled wait never runs", () => {
  const { target, listeners } = stubWindow("complete");
  let calls = 0;
  const cancel = afterFirstInteraction(() => {
    calls += 1;
  });
  cancel();
  target.dispatchEvent(new Event("pointerdown"));
  assert.equal(calls, 0);
  assert.equal(listeners(), 0);
});

test("a scroll before load (restoration, #hash) is not an interaction", () => {
  const loading = stubWindow("loading");
  let calls = 0;
  afterFirstInteraction(() => {
    calls += 1;
  });
  loading.target.dispatchEvent(new Event("scroll"));
  assert.equal(calls, 0);
  Object.assign(globalThis.document, { readyState: "complete" });
  loading.target.dispatchEvent(new Event("scroll"));
  assert.equal(calls, 1);
});
