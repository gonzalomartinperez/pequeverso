"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { AffiliateLink } from "@/features/commerce/presentation/affiliate-link.tsx";
import { ProductInterestLink } from "@/features/commerce/presentation/product-interest-link.tsx";
import type { HubNeed } from "../adapters/hub-products";

type Props = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "id" | "style" | "aria-describedby" | "onBlur" | "onClickCapture"
> & {
  className?: string | undefined;
  need: HubNeed;
  position: string;
  children: ReactNode;
};

/** One selection, one existing commerce handler; no nested anchors or intermediary chapters. */
export function HubProductLink({ need, position, children, ...attributes }: Props) {
  const props = { ...attributes, href: need.destination, product: need.product, position };
  return need.recommended ? (
    <AffiliateLink {...props} newTabLabel={need.newTabLabel}>
      {children}
    </AffiliateLink>
  ) : (
    <ProductInterestLink {...props}>{children}</ProductInterestLink>
  );
}
