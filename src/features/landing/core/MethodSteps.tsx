import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Step = { icon: IconName; title: string; text: string };

type Props = { steps: readonly Step[]; className?: string | undefined };

/**
 * Mira · Di · Traza · Une as four frosted tiles on the navy band (2 × 2 on phones, one row from
 * md). The number is the step order; the icon repeats the gesture.
 */
export function MethodSteps({ steps, className }: Props) {
  return (
    <ol
      data-slot="method-steps"
      className={cn("grid grid-cols-2 gap-3 cq-md:grid-cols-4 cq-md:gap-5", className)}
      role="list"
    >
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={cn(
            "glass-dark relative grid content-start gap-2 overflow-hidden rounded-xl p-4 cq-md:gap-3 cq-md:p-6",
            index % 2 === 1 && "bg-turquoise/10 border-turquoise/35",
          )}
          data-reveal=""
          style={{ "--i": index } as CSSProperties}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.75rem)] leading-none font-bold tabular-nums",
                index % 2 === 1 ? "text-turquoise" : "text-gold",
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-white/10 text-gold cq-md:size-12">
              <Icon name={step.icon} size={22} strokeWidth={2.2} />
            </span>
          </div>
          <h3 className="font-display text-[clamp(1.35rem,1.15rem+0.8vw,1.9rem)] font-bold text-white">
            {step.title}
          </h3>
          <p className="text-small text-pretty cq-md:text-base">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
