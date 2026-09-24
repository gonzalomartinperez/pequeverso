import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Reserved-size placeholder (e.g. the Hotmart widget slot while its script loads). */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}

export { Skeleton };
