"use client";

import { ExternalLink } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackAffiliateClick } from "@/features/tracking/track";

type Props = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "id" | "style" | "aria-describedby" | "onBlur" | "onClickCapture"
> & {
  /** Redirect path on pequeverso.com (`/alimentacion-bebe/?src=…`), answered by an edge rule. */
  href: string;
  /** Affiliate product slug (event `product` parameter). */
  product: string;
  position: string;
  /** Visually hidden note announcing the new tab. */
  newTabLabel: string;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * Link to a recommended third-party product. A plain `<a>` (never `next/link`): the path is a
 * 302 at the edge, not a page, so client navigation or prefetch would hit a 404. Opens a new
 * tab so the visitor keeps Pequeverso open; `rel="sponsored"` marks the affiliate relationship
 * for search engines and `noopener` isolates the opener. Emits one PequeversoAffiliateClick per
 * click and never a checkout or purchase event (Hotmart owns those).
 */
export function AffiliateLink({
  href,
  product,
  position,
  newTabLabel,
  className,
  children,
  ...attributes
}: Props) {
  return (
    <a
      {...attributes}
      href={href}
      target="_blank"
      rel="sponsored noopener"
      className={className}
      data-position={position}
      data-affiliate={product}
      onClick={() => trackAffiliateClick({ product, position, destination: href })}
    >
      <span>{children}</span>
      <span className="sr-only"> {newTabLabel}</span>
      <ExternalLink aria-hidden="true" focusable="false" size={18} strokeWidth={2.4} data-icon="inline-end" />
    </a>
  );
}
