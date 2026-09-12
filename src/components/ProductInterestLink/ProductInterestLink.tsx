"use client";

import { products } from "@config/commerce";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { withPassthrough } from "@/lib/params";
import { trackProductInterest } from "@/lib/tracking";

type Props = { href: string; position: string; children: ReactNode; className?: string };

/**
 * Hub → product link. Keeps allowlisted acquisition params across the internal navigation
 * and emits PequeversoProductInterest once per click.
 */
export function ProductInterestLink({ href, position, children, className }: Props) {
  const [target, setTarget] = useState(href);

  useEffect(() => {
    setTarget(withPassthrough(href, window.location.search));
  }, [href]);

  return (
    <Link
      href={target}
      className={className}
      data-position={position}
      onClick={() =>
        trackProductInterest({ product: products.grafismoFonetico.slug, position, destination: href })
      }
    >
      {children}
    </Link>
  );
}
