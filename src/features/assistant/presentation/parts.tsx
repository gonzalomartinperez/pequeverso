"use client";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/styles/cn.ts";
import { cx } from "@/shared/styles/cx.ts";
import { buttonVariants } from "@/shared/ui/button-variants.ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip.tsx";
import { affiliatePurchasePath, externalUrl, storefrontPath } from "../domain/links";
import styles from "./assistant.module.css";
import { usePresentation } from "./context";

/** Suggestion chips (starters, follow-ups): mint tint, teal text, 44 px targets; never coral. */
export const chipClass =
  "inline-flex min-h-11 max-w-full items-center rounded-md border border-navy/55 bg-card px-3 py-2 text-left text-small font-semibold text-heading transition-colors duration-(--duration-fast) hover:border-teal hover:bg-mint disabled:pointer-events-none disabled:opacity-50";

/** Small uppercase section label inside an answer. */
export const labelClass =
  "flex items-center gap-1.5 font-sans text-tiny font-extrabold tracking-wide text-subtle uppercase";

const TONES = {
  info: "border-line bg-sky text-body",
  notice: "border-line bg-mint text-body",
  danger: "border-destructive/50 bg-card text-body [&>svg]:text-destructive!",
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
              styles.iconControl,
              className,
            )}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className={styles.tooltip} positionerClassName="z-[100]" role="tooltip" side="bottom">
        {label}
      </TooltipContent>
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
  const path = storefrontPath(href, policy);
  if (path)
    return (
      <Link href={path} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  const external = externalUrl(href, policy);
  // Re-validated here so a caller can never render an unchecked URL; invalid links render nothing.
  if (!external || new URL(external).origin === policy.storefrontOrigin) return null;
  return (
    <a href={external} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{t.opensInNewTab}</span>
    </a>
  );
}

/** Edge redirects must use a plain anchor, never Next's client-side page navigation. */
export function AffiliateLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  const { policy, t } = usePresentation();
  const path = affiliatePurchasePath(href, policy);
  if (!path) return null;
  return (
    <a href={path} target="_blank" rel="sponsored noopener" className={className}>
      {children}
      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{t.opensInNewTab}</span>
    </a>
  );
}
