"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useState } from "react";

/** Pause/resume control of the enclosing `Marquee` (hidden under reduced motion, where nothing moves). */
export function MarqueeToggle() {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      data-slot="marquee-toggle"
      aria-pressed={paused}
      aria-label={paused ? "Reanudar el desplazamiento" : "Pausar el desplazamiento"}
      className="absolute top-1/2 right-1 z-1 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-heading shadow-sm motion-reduce:hidden"
      onClick={(event) => {
        const strip = event.currentTarget.closest<HTMLElement>(".pv-marquee");
        const next = !paused;
        if (strip) strip.toggleAttribute("data-paused", next);
        setPaused(next);
      }}
    >
      {paused ? (
        <PlayIcon className="size-4" aria-hidden="true" />
      ) : (
        <PauseIcon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
