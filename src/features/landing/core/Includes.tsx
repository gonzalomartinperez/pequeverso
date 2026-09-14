import type { Resource } from "@content/es/products";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { ResourceGrid } from "@/components/ui/ResourceGrid/ResourceGrid";
import { Stack } from "@/components/ui/Stack/Stack";
import { Counter } from "@/motion/Counter";
import styles from "./Includes.module.css";

type Props = {
  id: string;
  titleId: string;
  kicker: string;
  title: string;
  lead?: string;
  total: string;
  counts: { pdf: number; pages: number };
  /** Unit labels of the counted facts; the count line is omitted without them. */
  units?: { pdf: string; pages: string };
  resources: Resource[];
};

/** "Qué recibes": counted facts from the registry, the heading and the nine real resources. */
export function Includes({ id, titleId, kicker, title, lead, total, counts, units, resources }: Props) {
  return (
    <section id={id} className={styles.includes} aria-labelledby={titleId}>
      <Stack gap={3} maxWidth="62ch">
        <Eyebrow>{kicker}</Eyebrow>
        {units ? (
          <p className={styles.counts}>
            <Counter value={counts.pdf} /> {units.pdf} · <Counter value={counts.pages} /> {units.pages}
          </p>
        ) : null}
        <h2 id={titleId}>{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
      </Stack>
      <div className={styles.resources}>
        <ResourceGrid resources={resources} total={total} />
      </div>
    </section>
  );
}
