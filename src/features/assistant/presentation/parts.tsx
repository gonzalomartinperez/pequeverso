"use client";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx } from "@/lib/cx";
import { cn } from "@/lib/utils";
import { usePresentation } from "./context";

/** Suggestion chips (starters, follow-ups): mint tint, teal text, 44 px targets; never coral. */
export const chipClass =
  "inline-flex min-h-11 max-w-full items-center rounded-pill border-2 border-line-strong bg-card px-4 py-2 text-left text-small font-bold text-heading transition-colors duration-(--duration-fast) hover:border-teal hover:bg-mint disabled:pointer-events-none disabled:opacity-50";

/** Small uppercase section label inside an answer. */
export const labelClass =
  "flex items-center gap-1.5 font-sans text-tiny font-extrabold tracking-wide text-subtle uppercase";

const TONES = {
  info: "border-line bg-sky text-body",
  notice: "border-line bg-mint text-body",
  danger: "border-coral/40 bg-rose text-body",
} as const;

export function Callout({
  tone,
  role,
  children,
}: {
  tone: keyof typeof TONES;
  role?: "status" | "alert" | undefined;
  children: ReactNode;
}) {
  return (
    <div
      role={role}
      className={cx(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-small [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-icon",
        TONES[tone],
      )}
    >
      {children}
    </div>
  );
}

/** Icon-only control: the accessible name is the label; the tooltip is supplementary. */
export function IconButton({
  label,
  children,
  className,
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & { label: string; className?: string | undefined }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "border-transparent",
              className,
            )}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A validated URL as a link. Storefront URLs navigate client-side in the same tab (the root
 * layout keeps the conversation); other allowlisted hosts open in a new tab on an explicit click.
 * The URL must already have passed `domain/links.ts`.
 */
export function SafeLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  const { policy, onNavigate, t } = usePresentation();
  const url = new URL(href);
  if (url.origin === policy.storefrontOrigin)
    return (
      <Link href={`${url.pathname}${url.search}${url.hash}`} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  return (
    <a href={url.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{t.opensInNewTab}</span>
    </a>
  );
}
