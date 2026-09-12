"use client";

import { currency } from "@config/commerce";
import { useEffect } from "react";
import { trackViewContent } from "@/lib/tracking";

/** Fires ViewContent once when a product landing mounts. */
export function ViewContentOnMount({
  product,
  name,
  value,
}: {
  product: string;
  name: string;
  value: number;
}) {
  useEffect(() => {
    trackViewContent({ product, name, value, currency });
  }, [product, name, value]);
  return null;
}
