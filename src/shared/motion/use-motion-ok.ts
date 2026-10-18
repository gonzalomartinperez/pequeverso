"use client";

import { useSyncExternalStore } from "react";

export type MotionOK = {
  /** True when nothing blocks decorative motion. */
  ok: boolean;
  reducedMotion: boolean;
  finePointer: boolean;
  saveData: boolean;
};

const REDUCED = "(prefers-reduced-motion: reduce)";
const FINE = "(pointer: fine)";
const FLAG_REDUCED = 1;
const FLAG_FINE = 2;
const FLAG_SAVE_DATA = 4;

type ConnectionNavigator = Navigator & { connection?: { saveData?: boolean } };

function snapshot(): number {
  const saveData = (navigator as ConnectionNavigator).connection?.saveData === true;
  return (
    (window.matchMedia(REDUCED).matches ? FLAG_REDUCED : 0) |
    (window.matchMedia(FINE).matches ? FLAG_FINE : 0) |
    (saveData ? FLAG_SAVE_DATA : 0)
  );
}

function subscribe(onChange: () => void): () => void {
  const queries = [window.matchMedia(REDUCED), window.matchMedia(FINE)];
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

function serverSnapshot(): number {
  return 0;
}

/** Reactive motion gates: reduced motion, fine pointer and Save-Data (SSR: all false). */
export function useMotionOK(): MotionOK {
  const flags = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const reducedMotion = (flags & FLAG_REDUCED) !== 0;
  const saveData = (flags & FLAG_SAVE_DATA) !== 0;
  return {
    ok: !reducedMotion && !saveData,
    reducedMotion,
    finePointer: (flags & FLAG_FINE) !== 0,
    saveData,
  };
}
