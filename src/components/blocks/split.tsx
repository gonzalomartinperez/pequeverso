import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Ratio = "1/1" | "1.1/0.9" | "0.9/1.1" | "1.2/0.8" | "0.8/1.2";

type Props = {
  /** Width ratio of the first and second child from md up. */
  ratio?: Ratio | undefined;
  align?: "start" | "center" | "stretch" | undefined;
  /** Keeps the second child in view while the first scrolls (md up). */
  stickyAside?: boolean | undefined;
  /** Shows the second child (media) first on tablet-width containers only. */
  mediaFirstOnTablet?: boolean | undefined;
  className?: string | undefined;
  /** Exactly two children: copy first, media or aside second. */
  children: [ReactNode, ReactNode];
};

const RATIO: Record<Ratio, [string, string]> = {
  "1/1": ["1fr", "1fr"],
  "1.1/0.9": ["1.1fr", "0.9fr"],
  "0.9/1.1": ["0.9fr", "1.1fr"],
  "1.2/0.8": ["1.2fr", "0.8fr"],
  "0.8/1.2": ["0.8fr", "1.2fr"],
};
const ALIGN = { start: "items-start", center: "items-center", stretch: "items-stretch" } as const;

/** Two-column layout that collapses by container width (copy → media on phones). */
export function Split({
  ratio = "1/1",
  align = "start",
  stickyAside = false,
  mediaFirstOnTablet = false,
  className,
  children,
}: Props) {
  const [a, b] = RATIO[ratio];
  return (
    <div data-slot="split" className={cn("cq", className)}>
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] gap-8 cq-md:grid-cols-[minmax(0,var(--split-a))_minmax(0,var(--split-b))] cq-md:gap-12 [&>*]:min-w-0",
          ALIGN[align],
          stickyAside &&
            "cq-md:[&>:last-child]:sticky cq-md:[&>:last-child]:top-[calc(var(--header-height)+var(--space-5))] cq-md:[&>:last-child]:self-start",
          mediaFirstOnTablet && "cq-tablet:[&>:last-child]:-order-1",
        )}
        style={{ "--split-a": a, "--split-b": b } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
