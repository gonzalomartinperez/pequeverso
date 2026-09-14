import type { ReactNode } from "react";
import { WaveDivider, type WaveFill } from "@/motion/WaveDivider";
import styles from "./Section.module.css";

export type SectionTone = "cream" | "white" | "mint" | "sky" | "lemon" | "rose" | "navy";

type Props = {
  tone?: SectionTone;
  id?: string;
  /** Id of the heading that labels the section (aria-labelledby). */
  labelledBy?: string;
  /** Accessible name when the section has no heading. */
  label?: string;
  /** Wave edges are drawn inside the section with `dividerTone`; "overlap" pulls the content up over the previous band. */
  divider?: "none" | "wave-top" | "wave-bottom" | "overlap";
  /** Tone of the neighbouring band a wave divider belongs to (default cream). */
  dividerTone?: WaveFill;
  /** Skips rendering work until the section nears the viewport (content-visibility: auto). Not for overlap sections. */
  defer?: boolean;
  /** Wrap children in the centred container (default true). */
  container?: boolean;
  className?: string;
  children: ReactNode;
};

/** Page band: tone, optional wave/overlap edge, deferred rendering and the centred container. */
export function Section({
  tone = "cream",
  id,
  labelledBy,
  label,
  divider = "none",
  dividerTone = "cream",
  defer = false,
  container = true,
  className,
  children,
}: Props) {
  const classes = [
    styles.section,
    styles[tone],
    divider === "wave-top" ? styles.waveTop : "",
    divider === "wave-bottom" ? styles.waveBottom : "",
    divider === "overlap" ? styles.overlap : "",
    defer ? styles.defer : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={classes} id={id} aria-labelledby={labelledBy} aria-label={label}>
      {divider === "wave-top" ? <WaveDivider fill={dividerTone} flip className={styles.edgeTop} /> : null}
      {container ? <div className={styles.inner}>{children}</div> : children}
      {divider === "wave-bottom" ? <WaveDivider fill={dividerTone} className={styles.edgeBottom} /> : null}
    </section>
  );
}
