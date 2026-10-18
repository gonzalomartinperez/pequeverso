"use client";

import { currency } from "@config/commerce.ts";
import { useEffect } from "react";
import { trackViewContent } from "@/features/tracking/adapters/track.ts";

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
