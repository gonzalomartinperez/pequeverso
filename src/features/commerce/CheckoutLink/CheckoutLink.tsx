"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { buildCheckoutUrl, sckFor } from "@/features/commerce/checkout-url";
import { trackCheckoutIntent } from "@/features/tracking/track";

/** Plain checkout facts of a core product, passed from the server template (never the registry). */
export type CheckoutTarget = {
  slug: string;
  checkoutUrl: string;
  offer: string;
  sckPrefix: string;
  fallbackPath: string;
};

type Props = {
  product: CheckoutTarget;
  position: string;
  children: ReactNode;
  className?: string;
};

/**
 * Principal CTA. Server-renders the base checkout URL, then upgrades it on the client with
 * the allowlisted acquisition parameters from the page URL and a per-position `sck`.
 * Fires exactly one CheckoutIntent per click and navigates in the same tab.
 */
export function CheckoutLink({ product, position, children, className }: Props) {
  const { checkoutUrl, fallbackPath, sckPrefix } = product;
  const [href, setHref] = useState(checkoutUrl || fallbackPath);

  useEffect(() => {
    if (!checkoutUrl) return;
    setHref(buildCheckoutUrl(checkoutUrl, window.location.search, { sck: sckFor(sckPrefix, position) }));
  }, [checkoutUrl, sckPrefix, position]);

  const onClick = () => {
    trackCheckoutIntent({ product: product.slug, offer: product.offer, position });
  };

  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      data-checkout
      data-position={position}
      target={checkoutUrl ? "_blank" : undefined}
      rel={checkoutUrl ? "noopener" : undefined}
    >
      <ShoppingBag
        aria-hidden="true"
        focusable="false"
        size={20}
        strokeWidth={2.4}
        className="button__icon"
      />
      <span>{children}</span>
      <ArrowRight aria-hidden="true" focusable="false" size={18} strokeWidth={2.4} className="button__icon" />
    </a>
  );
}
