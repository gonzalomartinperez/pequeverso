import { Icon, type IconName } from "@/components/ui/Icon/Icon";
import styles from "./IconBadge.module.css";

type Size = 48 | 56 | 72;

type Props = {
  icon: IconName;
  size?: Size;
  tone?: "light" | "dark";
  /** Step number shown in a small gold disc (decorative). */
  number?: number;
  className?: string;
};

const SIZE_CLASS: Record<Size, string> = { 48: "sm", 56: "md", 72: "lg" };
const ICON_SIZE: Record<Size, number> = { 48: 22, 56: 26, 72: 30 };

/** Circular icon disc (teal on light, gold on navy) with an optional step number. */
export function IconBadge({ icon, size = 56, tone = "light", number, className }: Props) {
  return (
    <span
      className={`${styles.badge} ${styles[SIZE_CLASS[size]]} ${tone === "dark" ? styles.dark : ""} ${className ?? ""}`}
    >
      <Icon name={icon} size={ICON_SIZE[size]} strokeWidth={2.2} />
      {number === undefined ? null : (
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
      )}
    </span>
  );
}
