import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/compras-y-reembolsos/",
  title: "Compras y reembolsos",
  description:
    "Cómo funciona la compra en Hotmart, qué verás en la página de pago, cómo acceder a los archivos, cómo pedir un reembolso y cómo se combinan la garantía y tus derechos legales.",
  noindex: true,
});

export { default } from "@/views/legal/compras-y-reembolsos-view";
