import { Card } from "@/components/ui/Card/Card";
import { Grid } from "@/components/ui/Grid/Grid";
import type { IconName } from "@/components/ui/Icon/Icon";
import { IconBadge } from "@/components/ui/IconBadge/IconBadge";
import styles from "./IconCardList.module.css";

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
          className={styles.item}
          reveal
          stagger={index % cols}
        >
          <IconBadge icon={item.icon} tone={tone} number={numbered ? index + 1 : undefined} />
          <h3 className={styles.title}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
        </Card>
      ))}
    </Grid>
  );
}
