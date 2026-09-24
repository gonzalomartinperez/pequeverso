import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" | undefined };

/**
 * Hairline rule between content groups. A server component with the markup Base UI's Separator
 * renders (`role="separator"`, `aria-orientation`), so pages that only need a rule ship no
 * client JavaScript for it.
 */
function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-slot="separator"
      data-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
