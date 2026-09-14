import type { CSSProperties, ReactNode } from "react";
import styles from "./Card.module.css";

type Props = {
  variant?: "default" | "emphasis" | "soft" | "navy";
  pad?: "md" | "lg";
  as?: "div" | "article" | "li" | "section" | "figure";
  id?: string;
  /** Reveal on scroll (`data-reveal`). */
  reveal?: boolean;
  /** Stagger index (`--i`) for grouped reveals. */
  stagger?: number;
  className?: string;
  children: ReactNode;
};

/** Surface with border, radius and elevation; "navy" flips text to the on-navy palette. */
export function Card({
  variant = "default",
  pad = "md",
  as = "div",
  id,
  reveal = false,
  stagger,
  className,
  children,
}: Props) {
  const Tag = as;
  const style = stagger === undefined ? undefined : ({ "--i": stagger } as CSSProperties);
  return (
    <Tag
      id={id}
      className={`${styles.card} ${styles[variant]} ${styles[pad]} ${className ?? ""}`}
      data-reveal={reveal ? "" : undefined}
      style={style}
    >
      {children}
    </Tag>
  );
}
