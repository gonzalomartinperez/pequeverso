import { Icon, type IconName } from "@/components/Icon/Icon";
import styles from "./FactChip.module.css";

type Props = { icon?: IconName; label: string; detail?: string; tone?: "light" | "dark" };

export function FactChip({ icon, label, detail, tone = "light" }: Props) {
  return (
    <div className={`${styles.chip} ${tone === "dark" ? styles.dark : ""}`}>
      {icon ? <Icon name={icon} size={20} strokeWidth={2.2} className={styles.icon} /> : null}
      <span className={styles.text}>
        <strong>{label}</strong>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
      </span>
    </div>
  );
}
