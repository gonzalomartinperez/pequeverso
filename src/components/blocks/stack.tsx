import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Vertical rhythm as a spacing step (`--space-<gap>`). */
  gap?: 2 | 3 | 4 | 5 | 6;
  /** Optional measure, e.g. "62ch". */
  maxWidth?: string;
  align?: "start" | "center";
  as?: "div" | "header" | "section" | "article";
  id?: string;
  className?: string;
  children: ReactNode;
};

const GAP = { 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-6", 6: "gap-8" } as const;

/** Vertical flow with a consistent gap and an optional measure. */
export function Stack({
  gap = 4,
  maxWidth,
  align = "start",
  as: Tag = "div",
  id,
  className,
  children,
}: Props) {
  const style = maxWidth ? ({ maxWidth } as CSSProperties) : undefined;
  return (
    <Tag
      id={id}
      data-slot="stack"
      className={cn(
        "grid content-start justify-items-start [&>*]:max-w-full",
        GAP[gap],
        align === "center" && "mx-auto justify-items-center text-center",
        className,
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}
