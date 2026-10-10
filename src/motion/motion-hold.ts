/**
 * Scoped holds on decorative page motion (adapted from the owner's portfolio `motion-state`,
 * MIT). A surface that covers the page (the assistant's expanded or phone panel) takes a hold;
 * while any hold exists the WebGL scene stops rendering, a cold scene start waits, and CSS motion
 * under the page landmarks is paused (`:root[data-motion-hold]` in motion.css). Releasing the last
 * hold restores exactly the previous state: the visitor's own pause toggle is never changed.
 */
const holds = new Set<symbol>();
const listeners = new Set<() => void>();

function notify() {
  if (holds.size > 0) document.documentElement.dataset.motionHold = "";
  else delete document.documentElement.dataset.motionHold;
  for (const listener of listeners) listener();
}

/** Takes a hold; call the returned function (idempotent) to release it. */
export function holdPageMotion(): () => void {
  const hold = Symbol("page-motion-hold");
  holds.add(hold);
  notify();
  return () => {
    if (holds.delete(hold)) notify();
  };
}

export function isPageMotionHeld(): boolean {
  return holds.size > 0;
}

export function subscribePageMotionHold(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
