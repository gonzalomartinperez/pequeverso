import type { ReactNode } from "react";
import { Eyebrow, type EyebrowAccent } from "@/components/blocks/eyebrow";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  kicker?: string;
  /** Plain text or a node; wrap one accent phrase in `<span className="text-gradient">` (`text-gradient-sky` on navy). */
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  /** `dark` re-scopes colours for use outside a navy `Section` (inside one it is implied). */
  tone?: "light" | "dark";
  /** Chip tone of the kicker (default `auto`). */
  kickerAccent?: EyebrowAccent | undefined;
  /** `lg` uses the display size for a page's lead section heading. */
  size?: "default" | "lg" | undefined;
  /** Reveal style (default `rise`; `blur` uses the blur-in variant; `none` disables it). */
  reveal?: "rise" | "blur" | "none" | undefined;
  className?: string;
};

/** Consistent section header: pill kicker + h2 (labelling the section) + optional lead. */
export function SectionHeading({
  id,
  kicker,
  title,
  lead,
  align = "start",
  tone = "light",
  kickerAccent = "auto",
  size = "default",
  reveal = "rise",
  className,
}: Props) {
  return (
    <div
      data-slot="section-heading"
      data-reveal={reveal === "none" ? undefined : reveal === "blur" ? "blur" : ""}
      className={cn(
        "mb-10 grid max-w-[62ch] gap-4",
        align === "center" && "mx-auto justify-items-center text-center",
        tone === "dark" && "on-navy",
        className,
      )}
    >
      {kicker ? <Eyebrow accent={kickerAccent}>{kicker}</Eyebrow> : null}
      <h2 id={id} className={size === "lg" ? "text-display" : undefined}>
        {title}
      </h2>
      {lead ? (
        <p className={cn("lead max-w-[56ch] text-pretty", align === "center" && "mx-auto")}>{lead}</p>
      ) : null}
    </div>
  );
}
