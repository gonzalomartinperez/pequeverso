"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { cx } from "@/lib/cx";
import type { SceneOptions } from "./scene-runtime";
import { useSceneRuntime } from "./use-scene-runtime";

type Props = {
  /** Server-rendered static layers (StaticStarfield, planets, Orbit): the finished fallback. */
  children: ReactNode;
  pauseLabel?: string | undefined;
  playLabel?: string | undefined;
  options?: SceneOptions | undefined;
  className?: string | undefined;
};

const loadRuntime = () => import("./scene-runtime");

/**
 * Host of the 3D "pequeño universo": the static layers stay in the HTML (`pv-scene-static`), a
 * canvas is created after idle and the WebGL scene fades in over them (`data-live`), and a pause
 * control satisfies WCAG 2.2.2 (`data-mode="paused"` also stops the CSS orbit). The control sits
 * outside the paint-contained layer with `z-10`, so hosts must not wrap the stage in a stacking
 * context below their content.
 */
export function SceneStage({
  children,
  pauseLabel = "Pausar la animación",
  playLabel = "Reanudar la animación",
  options,
  className,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const { mode, live, controls, toggle } = useSceneRuntime(host, layer, loadRuntime, options);
  const paused = mode === "paused";

  return (
    <div
      ref={host}
      data-slot="scene-stage"
      data-mode={mode}
      data-live={live ? "" : undefined}
      className={cx("absolute inset-0", className)}
    >
      <div ref={layer} aria-hidden="true" className="absolute inset-0 overflow-hidden contain-paint">
        <div className="pv-scene-static absolute inset-0">{children}</div>
      </div>
      {controls ? (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={paused}
          data-slot="scene-toggle"
          title={paused ? playLabel : pauseLabel}
          className="pointer-events-auto absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full border border-white/22 bg-navy-deep/60 text-white transition-[background-color,color] duration-(--duration-fast) ease-out hover:bg-white/20 focus-visible:outline-gold"
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
