"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useState } from "react";

/** Pause/resume control of the enclosing `PageWall` (WCAG 2.2.2); hidden under reduced motion. */
export function WallToggle() {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      data-slot="page-wall-toggle"
      aria-pressed={paused}
      aria-label={paused ? "Reanudar el desplazamiento" : "Pausar el desplazamiento"}
      className="glass absolute right-3 bottom-3 z-1 grid size-11 cursor-pointer place-items-center rounded-full text-navy shadow-md transition-transform duration-(--duration-fast) ease-out hover:scale-105 motion-reduce:hidden sm:right-5 sm:bottom-5"
      onClick={(event) => {
        const wall = event.currentTarget.closest<HTMLElement>("[data-slot='page-wall']");
        const next = !paused;
        wall?.toggleAttribute("data-paused", next);
        setPaused(next);
      }}
    >
      {paused ? (
        <PlayIcon className="size-4.5" fill="currentColor" aria-hidden="true" />
      ) : (
        <PauseIcon className="size-4.5" fill="currentColor" aria-hidden="true" />
      )}
    </button>
  );
}
