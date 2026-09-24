"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { SceneOptions, SceneRuntime } from "./scene-runtime";

/** `static`: the server-rendered layers are showing; `running`: the WebGL scene animates; `paused`: all motion stopped. */
export type SceneMode = "static" | "running" | "paused";

type Loader = () => Promise<{
  mountScene: (host: HTMLElement, canvas: HTMLCanvasElement, options?: SceneOptions) => SceneRuntime;
}>;

const REDUCED = "(prefers-reduced-motion: reduce)";
const SHORT = "(max-height: 649px)";
const CANVAS_STYLE =
  "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity var(--duration-reveal) var(--pv-ease-out)";

type ConnectionNavigator = Navigator & { connection?: { saveData?: boolean } };

/**
 * Runs `callback` after the window `load` event (the LCP image has painted) once the main thread
 * is idle, so compiling the scene never competes with the hero; returns a canceller.
 */
function whenIdle(callback: () => void): () => void {
  let cancel: (() => void) | undefined;
  const idle = () => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(callback, { timeout: 2000 });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(callback, 400);
      cancel = () => window.clearTimeout(id);
    }
  };
  if (document.readyState === "complete") {
    idle();
    return () => cancel?.();
  }
  window.addEventListener("load", idle, { once: true });
  return () => {
    window.removeEventListener("load", idle);
    cancel?.();
  };
}

/**
 * Mounts a scene runtime lazily: after the page is idle it creates a canvas inside `layerRef`,
 * `await import()`s the runtime (never part of the initial bundle) and mounts it, unless reduced
 * motion, a short viewport or Save-Data says otherwise (then no canvas exists at all). A lost
 * WebGL context falls back to the static layers until the context is restored. `controls` is true
 * whenever motion may play, so the pause toggle (WCAG 2.2.2) also stops the CSS orbit fallback.
 */
export function useSceneRuntime(
  hostRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
  load: Loader,
  options?: SceneOptions,
): { mode: SceneMode; live: boolean; controls: boolean; toggle: () => void } {
  const runtime = useRef<SceneRuntime | null>(null);
  const pausedRef = useRef(false);
  const latestOptions = useRef(options);
  latestOptions.current = options;
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(false);
  const [controls, setControls] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    if (!host || !layer) return;
    const reduced = matchMedia(REDUCED);
    const short = matchMedia(SHORT);
    let canvas: HTMLCanvasElement | null = null;
    let cancelIdle: (() => void) | null = null;
    let generation = 0;
    const stop = () => {
      runtime.current?.dispose();
      runtime.current = null;
      setLive(false);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      generation += 1;
      stop();
    };
    const restored = () => mount(++generation);
    const removeCanvas = () => {
      canvas?.removeEventListener("webglcontextlost", lost);
      canvas?.removeEventListener("webglcontextrestored", restored);
      canvas?.remove();
      canvas = null;
    };
    const mount = async (token: number) => {
      try {
        const { mountScene } = await load();
        if (token !== generation || !canvas) return;
        runtime.current = mountScene(host, canvas, latestOptions.current);
        runtime.current.sync(pausedRef.current);
        canvas.style.opacity = "1";
        setLive(true);
      } catch {
        if (token === generation) stop();
      }
    };
    const initialize = () => {
      const token = ++generation;
      cancelIdle?.();
      stop();
      removeCanvas();
      setControls(!reduced.matches);
      const saveData = (navigator as ConnectionNavigator).connection?.saveData === true;
      if (reduced.matches || short.matches || saveData) return;
      cancelIdle = whenIdle(() => {
        if (token !== generation) return;
        canvas = document.createElement("canvas");
        canvas.style.cssText = CANVAS_STYLE;
        canvas.addEventListener("webglcontextlost", lost);
        canvas.addEventListener("webglcontextrestored", restored);
        layer.append(canvas);
        void mount(token);
      });
    };
    reduced.addEventListener("change", initialize);
    short.addEventListener("change", initialize);
    initialize();
    return () => {
      generation += 1;
      cancelIdle?.();
      reduced.removeEventListener("change", initialize);
      short.removeEventListener("change", initialize);
      runtime.current?.dispose();
      runtime.current = null;
      removeCanvas();
    };
  }, [hostRef, layerRef, load]);

  const toggle = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    runtime.current?.sync(pausedRef.current);
  }, []);

  const mode: SceneMode = paused ? "paused" : live ? "running" : "static";
  return { mode, live, controls, toggle };
}
