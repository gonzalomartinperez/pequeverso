import { Grid } from "@/components/blocks/grid";
import type { IconName } from "@/components/blocks/icon";
import { IconBadge, type IconBadgeAccent } from "@/components/blocks/icon-badge";
import { Card } from "@/components/ui/card";

type Item = { icon: IconName; title: string; text: string };

type Props = {
  items: readonly Item[];
  cols?: 2 | 3 | 4;
  /** Ordered steps: renders an <ol> and a number on each badge. */
  numbered?: boolean;
  tone?: "light" | "dark";
  /** Light card surface (default `elevated`); navy lists use `glass-dark`. */
  variant?: "default" | "elevated" | "glass" | "gradient" | undefined;
  /** Tile family of the icon badges (default `auto`). */
  accent?: IconBadgeAccent | undefined;
  className?: string;
};

/** Grid of cards with a gradient icon tile, a title and a short text; hover lift and staggered reveal. */
export function IconCardList({
  items,
  cols = 3,
  numbered = false,
  tone = "light",
  variant = "elevated",
  accent = "auto",
  className,
}: Props) {
  return (
    <Grid cols={cols} as={numbered ? "ol" : "ul"} className={className}>
      {items.map((item, index) => (
        <Card
          key={item.title}
          as="li"
          variant={tone === "dark" ? "glass-dark" : variant}
          pad="lg"
          lift={tone !== "dark"}
          reveal
          stagger={index % cols}
        >
          <IconBadge icon={item.icon} tone={tone} accent={accent} number={numbered ? index + 1 : undefined} />
          <h3 className="mt-2 text-h3">{item.title}</h3>
          <p className="text-small">{item.text}</p>
        </Card>
      ))}
    </Grid>
  );
}
