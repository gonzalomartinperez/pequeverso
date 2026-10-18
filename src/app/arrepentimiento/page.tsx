import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/arrepentimiento/",
  title: "Botón de arrepentimiento",
  description:
    "Cómo revocar una compra de Pequeverso: pedido por correo o en Hotmart, sin registro, con código de identificación en 24 horas.",
  noindex: true,
});

export { default } from "@/views/legal/arrepentimiento-view";
