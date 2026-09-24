import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  tone?: "info" | "success" | "warning";
  title?: string;
  children: ReactNode;
  role?: "status" | "alert";
  className?: string;
};

const TONE = { info: "bg-sky", success: "bg-mint", warning: "bg-lemon" } as const;

/** Soft panel for practical notes (info sky, success mint, warning lemon). */
export function Notice({ tone = "info", title, children, role = "status", className }: Props) {
  return (
    <div
      data-slot="notice"
      className={cn(
        "grid gap-2 rounded-lg border border-border px-6 py-4 [&_p]:text-body",
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
