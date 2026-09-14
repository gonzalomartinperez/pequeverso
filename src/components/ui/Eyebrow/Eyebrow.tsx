import type { ReactNode } from "react";
import styles from "./Eyebrow.module.css";

type Props = {
  tone?: "light" | "dark";
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
};

/** Small uppercase label above a heading (mint chip on light, gold on navy). */
export function Eyebrow({ tone = "light", as = "p", className, children }: Props) {
  const Tag = as;
  return (
    <Tag className={`${styles.eyebrow} ${tone === "dark" ? styles.dark : ""} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
