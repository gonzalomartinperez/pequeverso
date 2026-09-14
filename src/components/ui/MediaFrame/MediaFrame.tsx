import type { ReactNode } from "react";
import { TiltCard } from "@/motion/TiltCard";
import styles from "./MediaFrame.module.css";

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

const RATIO_CLASS: Record<Ratio, string> = { "4/3": "ratio43", "3/4": "ratio34", "16/9": "ratio169" };
const ELEVATION_CLASS = { none: "", sm: "elevSm", md: "elevMd", lg: "elevLg" } as const;

/** Rounded media box with a reserved aspect ratio (no CLS), elevation and optional tilt. */
export function MediaFrame({
  ratio = "4/3",
  elevation = "md",
  tilt = false,
  as = "div",
  className,
  children,
}: Props) {
  const elevationClass = ELEVATION_CLASS[elevation];
  const classes = `${styles.frame} ${styles[RATIO_CLASS[ratio]]} ${elevationClass ? styles[elevationClass] : ""} ${className ?? ""}`;
  if (tilt) {
    return (
      <TiltCard as={as} className={classes}>
        {children}
      </TiltCard>
    );
  }
  const Tag = as;
  return <Tag className={classes}>{children}</Tag>;
}
