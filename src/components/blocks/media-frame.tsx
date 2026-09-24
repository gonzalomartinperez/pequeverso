import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/motion/tilt-card";

type Ratio = "4/3" | "3/4" | "16/9";

type Props = {
  ratio?: Ratio;
  elevation?: "none" | "sm" | "md" | "lg";
  /** Pointer tilt on fine pointers (decorative). */
  tilt?: boolean;
  as?: "div" | "figure";
  className?: string;
  /** An <img>, <picture> or MediaImage; it fills the frame. */
  children: ReactNode;
};

const RATIO: Record<Ratio, string> = { "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "16/9": "aspect-video" };
const ELEVATION = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" } as const;

/** Rounded media box with a reserved aspect ratio (no CLS), elevation and optional tilt. */
export function MediaFrame({
  ratio = "4/3",
  elevation = "md",
  tilt = false,
  as = "div",
  className,
  children,
}: Props) {
  const classes = cn(
    "relative w-full overflow-hidden rounded-lg bg-sky [&_img]:size-full [&_img]:object-cover",
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
