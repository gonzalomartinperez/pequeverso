import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  tone?: "info" | "success" | "warning";
  title?: string;
  children: ReactNode;
  role?: "status" | "alert";
  className?: string;
};

const TONE = {
  info: "bg-linear-135 from-sky to-celeste",
  success: "bg-linear-135 from-mint to-white",
  warning: "bg-linear-135 from-lemon to-peach",
} as const;

/** Soft panel for practical notes (info sky, success mint, warning lemon). */
export function Notice({ tone = "info", title, children, role = "status", className }: Props) {
  return (
    <div
      data-slot="notice"
      className={cn(
        "on-light grid gap-2 rounded-lg border border-white px-6 py-5 shadow-sm [&>div_p]:text-body",
        TONE[tone],
        className,
      )}
      role={role}
    >
      {title ? <p className="font-extrabold text-heading">{title}</p> : null}
      <div className="grid gap-2">{children}</div>
    </div>
  );
}
