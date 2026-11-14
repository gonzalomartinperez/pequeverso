/**
 * Who gets the WebGL scene (ADR-0017, D-03). Everyone starts with the server-rendered static
 * starfield; the scene chunk is requested only on a fine pointer at least 1024 px wide, and only
 * after the visitor's first interaction, so the three.js and gsap closure never competes with the
 * first load and never reaches phones or in-app browsers.
 */
export const SCENE_MEDIA = "(pointer: fine) and (min-width: 1024px)";

export type SceneGateInput = {
  /** `(pointer: fine) and (min-width: 1024px)` matches. */
  fineWide: boolean;
  reducedMotion: boolean;
  /** `(max-height: 649px)`: a short landscape viewport has no room for the scene. */
  short: boolean;
  saveData: boolean;
};

/** Pure predicate: true when the scene may be loaded once the visitor interacts. */
export function sceneAllowed(input: SceneGateInput): boolean {
  return input.fineWide && !input.reducedMotion && !input.short && !input.saveData;
}

const INTERACTIONS = ["pointerdown", "keydown", "scroll", "wheel"] as const;

/**
 * Calls `callback` once on the first pointerdown, keydown, scroll or wheel (passive listeners on
 * `window`); returns a canceller. A programmatic scroll restoration counts as an interaction.
 */
export function afterFirstInteraction(callback: () => void): () => void {
  const off = () => {
    for (const type of INTERACTIONS) window.removeEventListener(type, fire);
  };
  function fire() {
    off();
    callback();
  }
  for (const type of INTERACTIONS) window.addEventListener(type, fire, { passive: true });
  return off;
}
