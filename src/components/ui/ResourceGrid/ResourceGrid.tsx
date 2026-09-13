import type { Resource } from "@content/es/products";
import { MediaImage } from "@/components/ui/MediaImage/MediaImage";
import { TiltCard } from "@/motion/TiltCard";
import styles from "./ResourceGrid.module.css";

type Props = { resources: Resource[]; compact?: boolean; total?: string };

/** The real resources of a product: cover, name, page count and what the file contains. */
export function ResourceGrid({ resources, compact = false, total }: Props) {
  return (
    <div className={styles.wrap}>
      <ol className={`${styles.grid} ${compact ? styles.compact : ""}`} role="list">
        {resources.map((resource, index) => (
          <li
            key={resource.id}
            className={styles.item}
            data-reveal
            style={{ transitionDelay: `${(index % 3) * 60}ms` }}
          >
            <TiltCard as="article" className={styles.card} max={4}>
              <div className={styles.cover}>
                <MediaImage
                  id={resource.card}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                />
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className={styles.body}>
                <p className={styles.pages}>{resource.pagesLabel}</p>
                <h3 className={styles.title}>{resource.title}</h3>
                {!compact ? <p className={styles.text}>{resource.description}</p> : null}
              </div>
            </TiltCard>
          </li>
        ))}
      </ol>
      {total ? <p className={styles.total}>{total}</p> : null}
    </div>
  );
}
