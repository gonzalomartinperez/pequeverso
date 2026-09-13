import { Icon, type IconName } from "@/components/ui/Icon/Icon";
import styles from "./Steps.module.css";

type Step = { icon: IconName; title: string; text: string };

/** Numbered horizontal steps (Mira · Di · Traza · Une) with a connecting line. */
export function Steps({ steps, tone = "light" }: { steps: readonly Step[]; tone?: "light" | "dark" }) {
  return (
    <ol className={`${styles.steps} ${tone === "dark" ? styles.dark : ""}`} role="list">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={styles.step}
          data-reveal
          style={{ transitionDelay: `${index * 60}ms` }}
        >
          <div className={styles.badge}>
            <Icon name={step.icon} size={26} strokeWidth={2.2} />
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
          </div>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.text}>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
