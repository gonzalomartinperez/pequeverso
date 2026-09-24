import type { CSSProperties, ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Universe } from "@/motion/universe";
import { WaveDivider } from "@/motion/wave-divider";
import styles from "./HeroScene.module.css";

type Props = {
  id: string;
  titleId: string;
  eyebrow: string;
  title: string;
  lead: string;
  /** Copy-column content between the lead and the actions (age selector, fact chips). */
  children?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  /** One-line assurance under the actions (built from config by the page). */
  trust?: string | undefined;
  /** The `HeroStack`, placed on the sky/desk boundary. */
  stack: ReactNode;
  /** Price or product card; sticks beside `desk` from lg up. */
  aside: ReactNode;
  /** Desk content beside the sticky aside (e.g. "Qué recibes"). */
  desk?: ReactNode | undefined;
};

const enter = (order: number): CSSProperties => ({ "--i": order }) as CSSProperties;

/**
 * "La mesa bajo el pequeño universo": a navy sky with the copy on the left, a wave into the
 * cream desk, the worksheet stack straddling the boundary and a card that sticks beside the
 * desk content. Layout is driven by container queries on the section itself.
 */
export function HeroScene({
  id,
  titleId,
  eyebrow,
  title,
  lead,
  children,
  actions,
  trust,
  stack,
  aside,
  desk,
}: Props) {
  return (
    <section id={id} className={styles.scene} aria-labelledby={titleId}>
      <div className={styles.grid}>
        <div className={styles.sky}>
          <Universe variant="hero" />
          <WaveDivider fill="cream" className={styles.wave} />
        </div>
        <div className={styles.copy}>
          <div data-hero-enter="" style={enter(0)}>
            <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          </div>
          <h1 id={titleId} className={styles.title} data-hero-enter="title" style={enter(1)}>
            {title}
          </h1>
          <p className={`lead ${styles.lead}`} data-hero-enter="" style={enter(2)}>
            {lead}
          </p>
          {children ? (
            <div className={styles.extra} data-hero-enter="" style={enter(3)}>
              {children}
            </div>
          ) : null}
          {actions ? (
            <div className={styles.actions} data-hero-enter="" style={enter(4)}>
              {actions}
            </div>
          ) : null}
          {trust ? (
            <p className={styles.trust} data-hero-enter="" style={enter(5)}>
              {trust}
            </p>
          ) : null}
        </div>
        <div className={styles.stack}>{stack}</div>
        <div className={styles.aside} data-hero-enter="" style={enter(3)}>
          {aside}
        </div>
        {desk ? <div className={styles.desk}>{desk}</div> : null}
      </div>
    </section>
  );
}
