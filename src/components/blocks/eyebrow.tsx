import type { ReactNode } from "react";
import { badgeVariants } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

type Props = { tone?: "light" | "dark"; as?: "p" | "span"; className?: string; children: ReactNode };

/** Small uppercase label above a heading (mint chip on light, gold on navy). */
export function Eyebrow({ tone = "light", as: Tag = "p", className, children }: Props) {
  return (
    <Tag
      data-slot="eyebrow"
      className={cn(badgeVariants({ variant: "chip" }), tone === "dark" && "on-navy", className)}
    >
      {children}
    </Tag>
  );
}
