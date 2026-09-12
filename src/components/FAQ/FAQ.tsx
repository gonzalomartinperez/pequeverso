import styles from "./FAQ.module.css";

type Item = { q: string; a: string };

/** Native <details> accordion: keyboard accessible without JavaScript. */
export function FAQ({ items }: { items: readonly Item[] }) {
  return (
    <div className={styles.list}>
      {items.map((item, index) => (
        <details key={item.q} className={styles.item} data-reveal open={index === 0}>
          <summary className={styles.summary}>
            <span>{item.q}</span>
            <span className={styles.chevron} aria-hidden="true" />
          </summary>
          <p className={styles.answer}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
