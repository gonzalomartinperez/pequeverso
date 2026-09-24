import { Eyebrow } from "@/components/blocks/eyebrow";
import { Stack } from "@/components/blocks/stack";
import styles from "./CenteredHeading.module.css";

type Props = {
  id: string;
  kicker?: string | undefined;
  title: string;
  lead?: string | undefined;
  tone?: "light" | "dark" | undefined;
};

/** Centred section header (kicker + h2 + lead) composed from Stack and Eyebrow. */
export function CenteredHeading({ id, kicker, title, lead, tone = "light" }: Props) {
  return (
    <div className={styles.heading} data-reveal>
      <Stack gap={3} align="center" maxWidth="62ch">
        {kicker ? <Eyebrow tone={tone}>{kicker}</Eyebrow> : null}
        <h2 id={id}>{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
      </Stack>
    </div>
  );
}
