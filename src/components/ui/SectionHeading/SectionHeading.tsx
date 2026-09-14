import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import styles from "./SectionHeading.module.css";

type Props = {
  id: string;
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  tone?: "light" | "dark";
};

/** Consistent section header: kicker + h2 (labelling the section) + optional lead. */
export function SectionHeading({ id, kicker, title, lead, align = "start", tone = "light" }: Props) {
  return (
    <div className={`${styles.heading} ${styles[align]} ${tone === "dark" ? styles.dark : ""}`} data-reveal>
      {kicker ? <Eyebrow tone={tone}>{kicker}</Eyebrow> : null}
      <h2 id={id}>{title}</h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </div>
  );
}
