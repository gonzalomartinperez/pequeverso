import type { CSSProperties, ReactNode } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";
import { Float } from "@/motion/float";

/**
 * Small server-side pieces shared by the landing sections: the gradient accent inside a
 * heading, the paper arc under a navy band, the floating syllable tile, the gold star, the
 * colour blend that joins two light bands and the captioned lifestyle photo.
 */

type AccentProps = {
  text: string;
  accent?: string | undefined;
  /** `sky` (turquoise → gold) inside navy bands; `ink` (navy → teal) on paper. */
  tone?: "sky" | "ink" | undefined;
};

/** Renders `text` with its `accent` phrase as gradient text (first occurrence only). */
export function Accent({ text, accent, tone = "ink" }: AccentProps): ReactNode {
  const at = accent ? text.indexOf(accent) : -1;
  if (!accent || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className={tone === "sky" ? "text-gradient-sky" : "text-gradient"}>{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

type ArcProps = {
  /** Colour of the band the arc opens into (a CSS colour or `var(--…)`). */
  fill: string;
  className?: string | undefined;
};

/** Soft convex curve where a navy band meets paper (a single arc, never a wave). */
export function Arc({ fill, className }: ArcProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className={cn("pointer-events-none block h-[clamp(2.5rem,7vw,6.5rem)] w-full", className)}
    >
      <path d="M0 10 C 22 -3.2, 78 -3.2, 100 10 Z" style={{ fill }} />
    </svg>
  );
}

const TILE_TONE = {
  gold: "bg-gold text-ink",
  white: "bg-white text-navy",
  turquoise: "bg-turquoise text-navy",
  peach: "bg-peach text-ink",
} as const;

type SyllableProps = {
  children: string;
  tone?: keyof typeof TILE_TONE | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  delay?: number | undefined;
  rotate?: number | undefined;
  className?: string | undefined;
};

const TILE_SIZE = {
  sm: "h-[clamp(2.75rem,8cqw,3.75rem)] min-w-[clamp(2.75rem,8cqw,3.75rem)] rounded-[0.9rem] px-[0.35em] text-[clamp(1.1rem,3.6cqw,1.6rem)]",
  md: "h-[clamp(3.25rem,11cqw,5rem)] min-w-[clamp(3.25rem,11cqw,5rem)] rounded-[1.1rem] px-[0.35em] text-[clamp(1.35rem,4.6cqw,2.1rem)]",
  lg: "h-[clamp(3.75rem,14cqw,6rem)] min-w-[clamp(3.75rem,14cqw,6rem)] rounded-[1.25rem] px-[0.35em] text-[clamp(1.6rem,5.6cqw,2.6rem)]",
} as const;

/** Decorative floating syllable tile (the kit's cards): a rounded square with a display syllable. */
export function SyllableTile({
  children,
  tone = "gold",
  size = "md",
  delay = 0,
  rotate,
  className,
}: SyllableProps) {
  return (
    <Float delay={delay} rotate={rotate} range={10} className={cn("absolute", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "grid place-items-center font-display leading-none font-bold tracking-[0.02em] shadow-float ring-1 ring-black/5",
          TILE_TONE[tone],
          TILE_SIZE[size],
        )}
      >
        {children}
      </span>
    </Float>
  );
}

const STAR = "M12 1.5l2.95 6.62 7.2.72-5.42 4.8 1.56 7.08L12 17.1l-6.29 3.62 1.56-7.08L1.85 8.84l7.2-.72z";

/** The brand's gold star with a soft glow. */
export function GoldStar({
  className,
  delay = 0,
}: {
  className?: string | undefined;
  delay?: number | undefined;
}) {
  return (
    <Float delay={delay} range={8} className={cn("absolute", className)}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        className="size-full fill-gold drop-shadow-[0_0_14px_oklch(0.8908_0.1645_93.89/70%)]"
      >
        <path d={STAR} />
      </svg>
    </Float>
  );
}

/** Top fade from the previous band's end colour, so two light gradients melt without a seam. */
export function Blend({ from, className }: { from: string; className?: string | undefined }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-40", className)}
      style={{ background: `linear-gradient(180deg, ${from}, transparent)` } as CSSProperties}
    />
  );
}

type PhotoProps = {
  id: string;
  sizes: string;
  /** Discreet caption for AI-generated lifestyle photos ("Imagen ilustrativa."). */
  caption?: string | undefined;
  className?: string | undefined;
  imgClassName?: string | undefined;
};

/** Lifestyle photo in a rounded frame with an optional glass caption in the corner. */
export function Photo({ id, sizes, caption, className, imgClassName }: PhotoProps) {
  return (
    <figure className={cn("relative m-0 overflow-hidden rounded-2xl bg-sky shadow-float", className)}>
      <div
        className={cn("size-full [&_img]:size-full [&_img]:object-cover [&_picture]:contents", imgClassName)}
      >
        <MediaImage id={id} sizes={sizes} />
      </div>
      {caption ? (
        <figcaption className="absolute right-3 bottom-3 rounded-pill bg-white/88 px-3 py-1 text-tiny font-bold text-body shadow-sm">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
