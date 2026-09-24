"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { cx } from "@/lib/cx";
import type { SceneOptions } from "./scene-runtime";
import { useSceneRuntime } from "./use-scene-runtime";

type Props = {
  /** Server-rendered static layers (StaticStarfield, planets, Orbit): the finished fallback. */
  children: ReactNode;
  pauseLabel?: string;
  playLabel?: string;
  options?: SceneOptions;
  className?: string;
};

const loadRuntime = () => import("./scene-runtime");

/**
 * Host of the 3D starfield: the static layers stay in the HTML, the canvas takes over once the
 * runtime loads (`data-scene-mode="running"` fades `pv-scene-static` out), and a pause control
 * satisfies WCAG 2.2.2 for motion that lasts longer than five seconds. The control sits outside
 * the paint-contained layer with `z-10`, so hosts must not wrap the stage in a stacking context
 * below their content (HeroScene's sky has no z-index for this reason).
 */
export function SceneStage({
  children,
  pauseLabel = "Pausar la animación",
  playLabel = "Reanudar la animación",
  options,
  className,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { mode, toggle } = useSceneRuntime(host, canvas, loadRuntime, options);
  const paused = mode === "paused";

  return (
    <div
      ref={host}
      data-slot="scene-stage"
      data-scene-mode={mode}
      className={cx("absolute inset-0", className)}
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden contain-paint">
        {children}
        <canvas ref={canvas} className="absolute inset-0 size-full" />
      </div>
      {mode !== "static" ? (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={paused}
          className="pointer-events-auto absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full border border-white/22 bg-white/10 text-white transition-[background-color,color] duration-(--duration-fast) ease-out hover:bg-white/20 focus-visible:outline-gold"
        >
          {paused ? (
            <PlayIcon aria-hidden="true" focusable="false" className="size-5" />
          ) : (
            <PauseIcon aria-hidden="true" focusable="false" className="size-5" />
          )}
          <span className="sr-only">{paused ? playLabel : pauseLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
