import { UndoIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  /** `navy` (default) reads as the store's dark utility bar; `light` for a cream page top. */
  tone?: "light" | "navy" | undefined;
};

/**
 * "Botón de arrepentimiento" link on the first screen of every page (Disposición SSDCyLC 954/2025:
 * visible at first access, prominent, exact label). Slim utility strip above any top bar and the
 * header: the link is a small pill with its icon in a disc, right-aligned.
 */
export function WithdrawalStrip({ tone = "navy" }: Props) {
  const navy = tone === "navy";
  return (
    <div
      data-slot="withdrawal-strip"
      data-tone={tone}
      className={cn("relative text-tiny", navy ? "bg-navy-deep" : "bg-cream")}
    >
      <div className="page-container flex min-h-8 items-center justify-end">
        <Link
          href="/arrepentimiento/"
          className={cn(
            "group inline-flex min-h-6 items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 font-bold no-underline transition-colors duration-(--duration-fast)",
            navy
              ? "text-turquoise hover:bg-white/8 hover:text-white"
              : "text-link hover:bg-navy/6 hover:text-link-hover",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("grid size-5 place-items-center rounded-full", navy ? "bg-white/10" : "bg-mint")}
          >
            <UndoIcon focusable="false" className="size-3" strokeWidth={2.6} />
          </span>
          <span className="underline decoration-1 underline-offset-2 group-hover:decoration-2">
            Botón de arrepentimiento
          </span>
        </Link>
      </div>
    </div>
  );
}
