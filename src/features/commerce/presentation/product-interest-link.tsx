"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type AnchorHTMLAttributes, type ReactNode, useEffect, useState } from "react";
import { withPassthrough } from "@/features/commerce/domain/checkout-url.ts";
import { trackProductInterest } from "@/features/tracking/adapters/track.ts";

type Props = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "id" | "style" | "aria-describedby" | "onBlur" | "onClickCapture"
> & {
  href: string;
  /** Slug of the product the link promotes (event `product` parameter). */
  product: string;
  position: string;
  children: ReactNode;
  className?: string | undefined;
};

/**
 * Hub → product link. Keeps allowlisted acquisition params across the internal navigation
 * and emits PequeversoProductInterest once per click.
 */
export function ProductInterestLink({ href, product, position, children, className, ...attributes }: Props) {
  const [target, setTarget] = useState(href);

  useEffect(() => {
    setTarget(withPassthrough(href, window.location.search));
  }, [href]);

  return (
    <Link
      {...attributes}
      href={target}
      className={className}
      data-position={position}
      onClick={() => trackProductInterest({ product, position, destination: href })}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" focusable="false" size={18} strokeWidth={2.4} data-icon="inline-end" />
    </Link>
  );
}
