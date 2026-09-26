import type { CSSProperties } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { getImage } from "@/lib/media";
import { cn } from "@/lib/utils";
import styles from "./page-wall.module.css";
import { WallToggle } from "./wall-toggle";

type Props = {
  /** Media ids of real pages (`gf.page.*`, `pack.page.*`), split across the rows in order. */
  ids: readonly string[];
  /** Accessible name of the wall. */
  label: string;
  /** Number of drifting rows (default 2). */
  rows?: 1 | 2 | undefined;
  className?: string | undefined;
};

/** Minimum cards per lap so one lap is wider than the widest viewport (seamless loop). */
const MIN_LAP = 12;
/** Seconds per card of travel (the loop speed stays the same whatever the lap length). */
const SECONDS_PER_CARD = 4.5;
const TILTS = ["-1.5deg", "1deg", "-0.5deg", "1.5deg", "-1deg", "0.5deg"] as const;
const SIZES = "(min-width: 1024px) 320px, 220px";

/** Fills a row up to `MIN_LAP` cards by repeating its pages in order. */
function lap(ids: readonly string[]): string[] {
  if (!ids.length) return [];
  const out = [...ids];
  while (out.length < MIN_LAP) out.push(...ids);
  return out;
}

function Lap({ ids, hidden }: { ids: readonly string[]; hidden?: boolean }) {
  return (
    <div className={styles.lap} aria-hidden={hidden ? "true" : undefined}>
      {ids.map((id, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: a lap repeats pages; order is fixed
          key={`${id}-${index}`}
          className={cn(styles.card, "rounded-[18px] bg-white p-1.5 shadow-float [&_img]:rounded-[12px]")}
          style={{ "--card-rotate": TILTS[index % TILTS.length] } as CSSProperties}
        >
          <MediaImage id={id} sizes={SIZES} alt="" />
        </div>
      ))}
    </div>
  );
}

/**
 * Decorative wall of real pages: one or two rows drifting in opposite directions on a -3° diagonal
 * (CSS transform loop, lazy images, pauses on hover/focus and with its toggle, static under reduced
 * motion). The pages are named once in a visually hidden list; the moving copies are `aria-hidden`.
 * The wall clips itself, so it never widens the page.
 */
export function PageWall({ ids, label, rows = 2, className }: Props) {
  const split =
    rows === 2 && ids.length > 1
      ? [ids.filter((_, index) => index % 2 === 0), ids.filter((_, index) => index % 2 === 1)]
      : [ids];
  const style = {
    "--wall-gap": "clamp(0.875rem, 1.6vw, 1.5rem)",
    "--wall-height": "clamp(9.5rem, 14vw + 4rem, 14.5rem)",
  } as CSSProperties;
  return (
    <div data-slot="page-wall" className={cn(styles.wall, "relative", className)} style={style}>
      <ul className="sr-only" aria-label={label}>
        {ids.map((id) => (
          <li key={id}>{getImage(id).alt}</li>
        ))}
      </ul>
      <div className={styles.tilt}>
        {split.map((row, index) => {
          const cards = lap(row);
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: at most two fixed rows
              key={index}
              className={styles.row}
              data-direction={index % 2 === 1 ? "reverse" : "forward"}
              style={
                { "--wall-duration": `${cards.length * SECONDS_PER_CARD + index * 6}s` } as CSSProperties
              }
              aria-hidden="true"
            >
              <div className={styles.track}>
                <Lap ids={cards} />
                <Lap ids={cards} hidden />
              </div>
            </div>
          );
        })}
      </div>
      <WallToggle />
    </div>
  );
}
