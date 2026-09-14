import type { CSSProperties } from "react";
import type { IconName } from "@/components/ui/Icon/Icon";
import { IconBadge } from "@/components/ui/IconBadge/IconBadge";
import styles from "./Steps.module.css";

type Step = { icon: IconName; title: string; text: string };

/** Numbered horizontal steps (Mira · Di · Traza · Une) with a connecting line. */
export function Steps({ steps, tone = "light" }: { steps: readonly Step[]; tone?: "light" | "dark" }) {
  return (
    <ol className={`${styles.steps} ${tone === "dark" ? styles.dark : ""}`} role="list">
      {steps.map((step, index) => (
        <li key={step.title} className={styles.step} data-reveal style={{ "--i": index } as CSSProperties}>
          <IconBadge icon={step.icon} size={72} tone={tone} number={index + 1} />
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.text}>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
