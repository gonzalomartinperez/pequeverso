import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = ComponentProps<"hr"> & { orientation?: "horizontal" | "vertical" | undefined };

/**
 * Hairline rule between content groups: a server-rendered `<hr>` (implicit `separator` role,
 * `aria-orientation` when vertical), so pages that only need a rule ship no client JavaScript.
 */
function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <hr
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      data-slot="separator"
      data-orientation={orientation}
      className={cn(
        "shrink-0 border-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-auto w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
