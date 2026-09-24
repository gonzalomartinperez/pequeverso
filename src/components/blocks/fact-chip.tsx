import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Props = { icon?: IconName; label: string; detail?: string; tone?: "light" | "dark"; className?: string };

/** Small factual chip (icon, bold label, optional detail) for hero and offer rows. */
export function FactChip({ icon, label, detail, tone = "light", className }: Props) {
  return (
    <div
      data-slot="fact-chip"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm",
        tone === "dark" && "on-navy border-white/20 bg-white/10 shadow-none",
        className,
      )}
    >
      {icon ? <Icon name={icon} size={20} strokeWidth={2.2} className="shrink-0 text-icon" /> : null}
      <span className="grid leading-tight">
        <strong className="text-[0.95rem]">{label}</strong>
        {detail ? <span className="text-tiny text-muted-foreground">{detail}</span> : null}
      </span>
    </div>
  );
}
