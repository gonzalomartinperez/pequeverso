import { Icon, type IconName } from "@/components/ui/Icon/Icon";
import styles from "./BulletList.module.css";

type Props = {
  items: readonly string[];
  icon?: IconName;
  tone?: "light" | "dark";
  className?: string;
};

/** Unordered list with an icon bullet (teal on light, gold on navy). */
export function BulletList({ items, icon = "sparkles", tone = "light", className }: Props) {
  return (
    <ul className={`${styles.list} ${tone === "dark" ? styles.dark : ""} ${className ?? ""}`} role="list">
      {items.map((item) => (
        <li key={item} className={styles.item}>
          <Icon name={icon} size={20} strokeWidth={2.2} className={styles.icon} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
