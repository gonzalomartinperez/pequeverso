"use client";

import { checkoutUrl, products } from "@config/commerce";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { buildCheckoutUrl, sckFor } from "@/lib/params";
import { trackCheckoutIntent } from "@/lib/tracking";

type Props = {
  position: string;
  children: ReactNode;
  className?: string;
  offer?: string;
  offerMode?: string;
};

const FALLBACK = "/grafismo-fonetico/#comprar";

/**
 * Principal CTA. Server-renders the base checkout URL, then upgrades it on the client with
 * the allowlisted acquisition parameters from the page URL and a per-position `sck`.
 * Fires exactly one CheckoutIntent per click and navigates in the same tab.
 */
export function CheckoutLink({ position, children, className, offer = "main-usd-14-99", offerMode }: Props) {
  const [href, setHref] = useState(checkoutUrl || FALLBACK);

  useEffect(() => {
    if (!checkoutUrl) return;
    setHref(buildCheckoutUrl(checkoutUrl, window.location.search, { sck: sckFor(position) }));
  }, [position]);

  const onClick = (_event: MouseEvent<HTMLAnchorElement>) => {
    trackCheckoutIntent({ product: products.grafismoFonetico.slug, offer, position, offerMode });
  };

  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      data-checkout
      data-position={position}
      rel={checkoutUrl ? "noopener" : undefined}
    >
      {children}
    </a>
  );
}
