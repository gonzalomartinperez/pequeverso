import type { Metadata } from "next";
import { buildMetadata } from "@/views/metadata.ts";

export const metadata: Metadata = buildMetadata({
  path: "/terminos/",
  title: "Términos de compra",
  description:
    "Condiciones de compra de los materiales digitales de Pequeverso a través de Hotmart: precio en moneda local, entrega, licencia de uso, garantía, arrepentimiento y jurisdicción.",
  noindex: true,
});

export { default } from "@/views/legal/terminos-view";
