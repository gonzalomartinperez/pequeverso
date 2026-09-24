import type { ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  /** `dark` re-scopes colours for use outside a navy `Section` (inside one it is implied). */
  tone?: "light" | "dark";
  className?: string;
};

/** Consistent section header: kicker + h2 (labelling the section) + optional lead. */
export function SectionHeading({
  id,
  kicker,
  title,
  lead,
  align = "start",
  tone = "light",
  className,
}: Props) {
  return (
    <div
      data-slot="section-heading"
      data-reveal=""
      className={cn(
        "mb-8 grid max-w-[62ch] gap-3",
        align === "center" && "mx-auto justify-items-center text-center",
        tone === "dark" && "on-navy",
        className,
      )}
    >
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <h2 id={id}>{title}</h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </div>
  );
}
