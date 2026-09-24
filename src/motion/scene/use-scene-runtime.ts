"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { SceneOptions, SceneRuntime } from "./scene-runtime";

export type SceneMode = "static" | "running" | "paused";

type Loader = () => Promise<{
  mountScene: (host: HTMLElement, canvas: HTMLCanvasElement, options?: SceneOptions) => SceneRuntime;
}>;

const REDUCED = "(prefers-reduced-motion: reduce)";
const SHORT = "(max-height: 649px)";

type ConnectionNavigator = Navigator & { connection?: { saveData?: boolean } };

/**
 * Loads a scene runtime lazily (`await import()` inside an effect, never in the initial
 * bundle) and mounts it on `canvas` unless reduced motion, a short viewport, Save-Data or a
 * lost WebGL context says otherwise. Returns the current mode and a pause/resume toggle.
 */
export function useSceneRuntime(
  hostRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  load: Loader,
  options?: SceneOptions,
): { mode: SceneMode; toggle: () => void } {
  const runtime = useRef<SceneRuntime | null>(null);
  const paused = useRef(false);
  const latestOptions = useRef(options);
  latestOptions.current = options;
  const [mode, setMode] = useState<SceneMode>("static");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const reduced = matchMedia(REDUCED);
    const short = matchMedia(SHORT);
    let cancelled = false;
    let generation = 0;
    const clear = () => {
      runtime.current?.dispose();
      runtime.current = null;
      setMode("static");
    };
    const initialize = async () => {
      const token = ++generation;
      clear();
      const saveData = (navigator as ConnectionNavigator).connection?.saveData === true;
      if (reduced.matches || short.matches || saveData) return;
      try {
        const { mountScene } = await load();
        if (cancelled || token !== generation) return;
        runtime.current = mountScene(host, canvas, latestOptions.current);
        runtime.current.sync(paused.current);
        setMode(paused.current ? "paused" : "running");
      } catch {
        if (!cancelled) clear();
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      generation += 1;
      clear();
    };
    const restart = () => {
      void initialize();
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restart);
    reduced.addEventListener("change", restart);
    short.addEventListener("change", restart);
    void initialize();
    return () => {
      cancelled = true;
      generation += 1;
      runtime.current?.dispose();
      runtime.current = null;
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restart);
      reduced.removeEventListener("change", restart);
      short.removeEventListener("change", restart);
    };
  }, [hostRef, canvasRef, load]);

  const toggle = useCallback(() => {
    paused.current = !paused.current;
    setMode(paused.current ? "paused" : "running");
    runtime.current?.sync(paused.current);
  }, []);

  return { mode, toggle };
}
