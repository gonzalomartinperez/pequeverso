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
  /**
   * The bundle framing: a line such as "Material principal + 8 bonos incluidos", one badge per
   * resource and the all-included price line. Built by the page from the registry and config.
   */
  bundle?:
    | { line: string; badges: readonly { label: string; tone?: "navy" | "gold" }[]; allIncluded: string }
    | undefined;
};

/**
 * "Qué recibes": counted facts from the registry, the heading, the main PDF and its included bonuses. The
 * resource grid follows this column's width: two cards from 30rem (two 4:3 covers), one below.
 */
export function Includes({
  id,
  titleId,
  kicker,
  title,
  lead,
  total,
  counts,
  units,
  resources,
  bundle,
}: Props) {
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
        {bundle ? (
          <p className="inline-flex flex-wrap items-center gap-2 rounded-md bg-lemon px-4 py-2 text-lead font-extrabold text-ink">
            {bundle.line}
          </p>
        ) : null}
        {lead ? <p className="lead text-pretty">{lead}</p> : null}
      </Stack>
      <ResourceGrid
        resources={resources}
        total={total}
        badges={bundle?.badges}
        className="[&_ol]:@min-[30rem]:grid-cols-2"
      />
      {bundle ? (
        <p className="justify-self-center text-center font-display text-h3 font-bold text-balance text-navy">
          {bundle.allIncluded}
        </p>
      ) : null}
    </section>
  );
}
