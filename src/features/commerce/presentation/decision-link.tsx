import { MousePointerClick } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/styles/cn.ts";
import { type ButtonVariantProps, buttonVariants } from "@/shared/ui/button-variants.ts";

type Props = ButtonVariantProps & { className?: string; children: ReactNode };

/** In-page link to the Hotmart decision block (`#gfp-decision`), never a checkout URL. */
export function DecisionLink({ variant = "primary", size = "default", block, className, children }: Props) {
  return (
    <a
      href="#gfp-decision"
      className={cn(buttonVariants({ variant, size, block }), className)}
      data-decision-link
    >
      <MousePointerClick
        aria-hidden="true"
        focusable="false"
        size={20}
        strokeWidth={2.4}
        data-icon="inline-start"
      />
      <span>{children}</span>
    </a>
  );
}
