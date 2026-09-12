import { Icon, type IconName } from "@/components/Icon/Icon";
import styles from "./TrustStrip.module.css";

type Item = { icon: IconName; text: string };

export function TrustStrip({
  items,
  label = "Garantías de compra",
}: {
  items: readonly Item[];
  label?: string;
}) {
  return (
    <section className={styles.strip} aria-label={label}>
      <ul className={`container ${styles.list}`} role="list">
        {items.map((item) => (
          <li key={item.text} className={styles.item}>
            <Icon name={item.icon} size={22} className={styles.icon} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
