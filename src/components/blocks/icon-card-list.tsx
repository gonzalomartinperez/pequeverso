import { Grid } from "@/components/blocks/grid";
import type { IconName } from "@/components/blocks/icon";
import { IconBadge } from "@/components/blocks/icon-badge";
import { Card } from "@/components/ui/card";

type Item = { icon: IconName; title: string; text: string };

type Props = {
  items: readonly Item[];
  cols?: 2 | 3 | 4;
  /** Ordered steps: renders an <ol> and a number on each badge. */
  numbered?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

/** Grid of cards with an icon badge, a title and a short text; staggered reveal. */
export function IconCardList({ items, cols = 3, numbered = false, tone = "light", className }: Props) {
  return (
    <Grid cols={cols} as={numbered ? "ol" : "ul"} className={className}>
      {items.map((item, index) => (
        <Card
          key={item.title}
          as="li"
          variant={tone === "dark" ? "navy" : "default"}
          reveal
          stagger={index % cols}
        >
          <IconBadge icon={item.icon} tone={tone} number={numbered ? index + 1 : undefined} />
          <h3 className="text-h3">{item.title}</h3>
          <p className="text-small">{item.text}</p>
        </Card>
      ))}
    </Grid>
  );
}
