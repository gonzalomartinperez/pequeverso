"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { withPassthrough } from "@/features/commerce/checkout-url";
import { trackProductInterest } from "@/features/tracking/track";

type Props = {
  href: string;
  /** Slug of the product the link promotes (event `product` parameter). */
  product: string;
  position: string;
  children: ReactNode;
  className?: string;
};

/**
 * Hub → product link. Keeps allowlisted acquisition params across the internal navigation
 * and emits PequeversoProductInterest once per click.
 */
export function ProductInterestLink({ href, product, position, children, className }: Props) {
  const [target, setTarget] = useState(href);

  useEffect(() => {
    setTarget(withPassthrough(href, window.location.search));
  }, [href]);

  return (
    <Link
      href={target}
      className={className}
      data-position={position}
      onClick={() => trackProductInterest({ product, position, destination: href })}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" focusable="false" size={18} strokeWidth={2.4} className="button__icon" />
    </Link>
  );
}
