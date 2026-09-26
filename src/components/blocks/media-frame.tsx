import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/motion/tilt-card";

type Ratio = "4/3" | "3/4" | "16/9" | "1/1";

type Props = {
  ratio?: Ratio;
  /** `float` is the layered navy-tinted shadow of the redesign. */
  elevation?: "none" | "sm" | "md" | "lg" | "float";
  /** Pointer tilt on fine pointers (decorative). */
  tilt?: boolean;
  /** `lg` 20 px (default) or `xl` 28 px corners. */
  radius?: "lg" | "xl" | undefined;
  /** Thin white inner frame (paper edge) over the media. */
  framed?: boolean | undefined;
  as?: "div" | "figure";
  className?: string;
  /** An <img>, <picture> or MediaImage; it fills the frame. */
  children: ReactNode;
};

const RATIO: Record<Ratio, string> = {
  "4/3": "aspect-[4/3]",
  "3/4": "aspect-[3/4]",
  "16/9": "aspect-video",
  "1/1": "aspect-square",
};
const ELEVATION = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  float: "shadow-float",
} as const;

/** Rounded media box with a reserved aspect ratio (no CLS), elevation and optional tilt. */
export function MediaFrame({
  ratio = "4/3",
  elevation = "md",
  tilt = false,
  radius = "lg",
  framed = false,
  as = "div",
  className,
  children,
}: Props) {
  const classes = cn(
    "relative w-full overflow-hidden bg-linear-160 from-celeste to-sky [&_img]:size-full [&_img]:object-cover",
    radius === "xl" ? "rounded-xl" : "rounded-lg",
    framed &&
      "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-white/70 after:content-['']",
    RATIO[ratio],
    ELEVATION[elevation],
    className,
  );
  if (tilt) {
    return (
      <TiltCard as={as} className={classes}>
        {children}
      </TiltCard>
    );
  }
  const Tag = as;
  return (
    <Tag data-slot="media-frame" className={classes}>
      {children}
    </Tag>
  );
}
