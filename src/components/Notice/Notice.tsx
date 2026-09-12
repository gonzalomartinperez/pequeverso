import type { ReactNode } from "react";
import styles from "./Notice.module.css";

type Props = {
  tone?: "info" | "success" | "warning";
  title?: string;
  children: ReactNode;
  role?: "status" | "alert";
};

export function Notice({ tone = "info", title, children, role = "status" }: Props) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={role}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
