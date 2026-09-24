import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { align?: "start" | "center"; className?: string; children: ReactNode };

/** Wrapping row of chips (FactChip, Eyebrow, Badge) with a consistent gap. */
export function ChipRow({ align = "start", className, children }: Props) {
  return (
    <div
      data-slot="chip-row"
      className={cn("flex flex-wrap gap-3", align === "center" && "justify-center", className)}
    >
      {children}
    </div>
  );
}
