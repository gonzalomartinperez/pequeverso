import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/cookies/",
  title: "Política de cookies",
  description: "Qué cookies usa pequeverso.com, para qué sirven, cuánto duran y cómo cambiar tu elección.",
  noindex: true,
});

export { default } from "@/views/legal/cookies-view";
