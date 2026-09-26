import type { IconName } from "@/components/blocks/icon";
import { IconDot } from "@/components/blocks/icon-dot";
import { cn } from "@/lib/utils";

type Props = { icon?: IconName; label: string; detail?: string; tone?: "light" | "dark"; className?: string };

/** Small factual pill (icon disc, bold label, optional detail) on glass for hero and offer rows. */
export function FactChip({ icon, label, detail, tone = "light", className }: Props) {
  return (
    <div
      data-slot="fact-chip"
      className={cn(
        "inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-pill py-1.5 pr-4",
        icon ? "pl-1.5" : "pl-4",
        tone === "dark" ? "on-navy glass-dark" : "on-light glass shadow-sm",
        className,
      )}
    >
      {icon ? <IconDot icon={icon} size="lg" /> : null}
      <span className="grid min-w-0 leading-tight">
        <strong className="text-[0.95rem]">{label}</strong>
        {detail ? <span className="text-tiny text-muted-foreground">{detail}</span> : null}
      </span>
    </div>
  );
}
