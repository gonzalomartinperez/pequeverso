import type { Resource } from "@content/es/products";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { ResourceGrid } from "@/components/blocks/resource-grid";
import { Stack } from "@/components/blocks/stack";
import { Counter } from "@/motion/counter";

type Props = {
  id: string;
  titleId: string;
  kicker: string;
  title: string;
  lead?: string | undefined;
  total: string;
  counts: { pdf: number; pages: number };
  /** Unit labels of the counted facts; the count line is omitted without them. */
  units?: { pdf: string; pages: string } | undefined;
  resources: Resource[];
};

/**
 * "Qué recibes": counted facts from the registry, the heading and the nine real resources. The
 * resource grid follows this column's width: two cards from 30rem (two 4:3 covers), one below.
 */
export function Includes({ id, titleId, kicker, title, lead, total, counts, units, resources }: Props) {
  return (
    <section
      id={id}
      data-slot="includes"
      className="grid scroll-mt-(--header-height) gap-8"
      aria-labelledby={titleId}
    >
      <Stack gap={3} maxWidth="62ch">
        <Eyebrow>{kicker}</Eyebrow>
        {units ? (
          <p className="font-display text-h2 font-bold text-navy">
            <Counter value={counts.pdf} /> {units.pdf} · <Counter value={counts.pages} /> {units.pages}
          </p>
        ) : null}
        <h2 id={titleId}>{title}</h2>
        {lead ? <p className="lead text-pretty">{lead}</p> : null}
      </Stack>
      <ResourceGrid resources={resources} total={total} className="[&_ol]:@min-[30rem]:grid-cols-2" />
    </section>
  );
}
