import type { CSSProperties } from "react";
import type { IconName } from "@/components/blocks/icon";
import { IconBadge, type IconBadgeAccent } from "@/components/blocks/icon-badge";
import { cn } from "@/lib/utils";

type Step = { icon: IconName; title: string; text: string };

type Props = {
  steps: readonly Step[];
  tone?: "light" | "dark";
  /** Tile family of the step badges (default `auto`: teal on light, turquoise on navy). */
  accent?: IconBadgeAccent | undefined;
  className?: string;
};

/** Numbered horizontal steps (Mira · Di · Traza · Une): gradient tiles joined by a dotted orbit line from md up. */
export function Steps({ steps, tone = "light", accent = "auto", className }: Props) {
  return (
    <div data-slot="steps" className={cn("cq", tone === "dark" && "on-navy", className)}>
      <ol
        className="relative grid grid-cols-2 gap-x-4 gap-y-8 cq-md:grid-cols-4 cq-md:gap-6 cq-md:before:absolute cq-md:before:inset-x-[8%] cq-md:before:top-[calc(var(--badge-lg)/2)] cq-md:before:h-0.5 cq-md:before:bg-[repeating-linear-gradient(90deg,var(--accent)_0_8px,transparent_0_16px)] cq-md:before:opacity-45 cq-md:before:content-['']"
        role="list"
      >
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="relative grid content-start justify-items-center gap-3 text-center"
            data-reveal=""
            style={{ "--i": index } as CSSProperties}
          >
            <IconBadge icon={step.icon} size={72} tone={tone} accent={accent} number={index + 1} />
            <h3 className="font-display text-2xl font-bold text-heading">{step.title}</h3>
            <p className="max-w-[24ch] text-small text-body">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
