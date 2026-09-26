import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { MarqueeToggle } from "./marquee-toggle";

type Props = {
  /** Items of one lap; the track repeats them once more (aria-hidden) for the seamless loop. */
  items: readonly ReactNode[];
  /** Accessible name of the strip (a list of what it shows). */
  label: string;
  /** Seconds per lap (default `--duration-marquee`). */
  seconds?: number | undefined;
  direction?: "forward" | "reverse" | undefined;
  /** Gap between items (CSS length, default 1rem). */
  gap?: string | undefined;
  /** Show the pause/resume control (WCAG 2.2.2; on by default). */
  control?: boolean | undefined;
  className?: string | undefined;
};

/** One lap of items; under reduced motion it wraps and centres instead of sliding. */
const LIST =
  "flex shrink-0 items-center gap-[var(--marquee-gap,1rem)] motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center";

/**
 * Infinite horizontal strip (fact chips, the wall of real pages). CSS-only loop that pauses on
 * hover, on focus and with its toggle; under reduced motion it becomes one static wrapped row.
 */
export function Marquee({
  items,
  label,
  seconds,
  direction = "forward",
  gap,
  control = true,
  className,
}: Props) {
  const style = {
    ...(seconds ? { "--marquee-duration": `${seconds}s` } : {}),
    ...(gap ? { "--marquee-gap": gap } : {}),
  } as CSSProperties;
  return (
    <div
      data-slot="marquee"
      data-direction={direction}
      className={cx("pv-marquee relative", className)}
      style={style}
    >
      <div className="pv-marquee-track">
        <ul className={LIST} aria-label={label}>
          {items.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list, never reordered
            <li key={index}>{item}</li>
          ))}
        </ul>
        <ul className={`${LIST} motion-reduce:hidden`} aria-hidden="true">
          {items.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: duplicate lap of the list above
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      {control ? <MarqueeToggle /> : null}
    </div>
  );
}
